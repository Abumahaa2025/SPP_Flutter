"""Parse rent-roll and expense text (CSV/TSV) from uploaded snippets."""

from __future__ import annotations

import csv
import io
import re
from typing import Any, Dict, List, Optional, Tuple

from .intake_classifier import extract_month, extract_year


def _money(raw: str) -> float:
    if not raw:
        return 0.0
    s = re.sub(r"[^\d.,\-]", "", str(raw)).replace(",", "")
    try:
        return float(s) if s else 0.0
    except ValueError:
        return 0.0


def _norm_ar_nums(text: str) -> str:
    return (
        text.replace("٠", "0")
        .replace("١", "1")
        .replace("٢", "2")
        .replace("٣", "3")
        .replace("٤", "4")
        .replace("٥", "5")
        .replace("٦", "6")
        .replace("٧", "7")
        .replace("٨", "8")
        .replace("٩", "9")
    )


def _detect_delimiter(line: str) -> str:
    if "\t" in line:
        return "\t"
    if line.count(";") > line.count(","):
        return ";"
    return ","


def _map_columns(headers: List[str]) -> Dict[str, int]:
    col: Dict[str, int] = {}
    for i, h in enumerate(headers):
        hl = _norm_ar_nums(h.strip().lower())
        if any(k in hl for k in ("وحدة", "unit", "شقة", "محل", "office", "apt")):
            col.setdefault("unit", i)
        if any(k in hl for k in ("مستأجر", "tenant", "اسم", "name", "الاسم")):
            col.setdefault("tenant", i)
        if any(k in hl for k in ("إيجار", "rent", "amount", "مبلغ", "قيمة")):
            col.setdefault("rent", i)
        if any(k in hl for k in ("جوال", "phone", "mobile", "هاتف")):
            col.setdefault("phone", i)
        if any(k in hl for k in ("عقد", "contract")):
            col.setdefault("contract", i)
        if any(k in hl for k in ("سداد", "paid", "payment", "حالة", "status", "تحصيل")):
            col.setdefault("pay_status", i)
        if any(k in hl for k in ("متأخر", "late", "delay")):
            col.setdefault("late", i)
        if any(k in hl for k in ("مدفوع", "paid amount", "محصل")):
            col.setdefault("paid", i)
    return col


def _cell(row: List[str], idx: int) -> str:
    if idx < 0 or idx >= len(row):
        return ""
    return str(row[idx]).strip()


def _infer_paid(row: dict) -> bool:
    ps = _norm_ar_nums(str(row.get("pay_status") or "")).lower()
    if any(k in ps for k in ("مسدد", "paid", "كاش", "بنك", "تحويل", "سداد")):
        return True
    if any(k in ps for k in ("لم", "pending", "متأخر", "late", "غير")):
        return False
    if row.get("paid") and float(row["paid"]) > 0:
        return True
    return False


def _infer_late(row: dict) -> bool:
    ps = _norm_ar_nums(str(row.get("pay_status") or "")).lower()
    late = _norm_ar_nums(str(row.get("late") or "")).lower()
    if any(k in ps + late for k in ("متأخر", "late", "overdue", "لم يسدد", "غير مسدد")):
        return True
    return not row.get("is_paid") and float(row.get("rent") or 0) > 0


def _is_generic_shop_label(text: str) -> bool:
    return bool(re.match(r"^(?:محل|دكان|shop|store|تجاري|commercial)$", (text or "").strip(), re.I))


def _stable_shop_unit_id(row: dict) -> str:
    contract = (row.get("contract") or "").strip()
    if contract and len(contract) > 2 and contract.lower() not in ("بدون", "لا", "none", "-"):
        return f"c:{contract}"
    phone = (row.get("phone") or "").strip()
    if len(phone) >= 8:
        return f"p:{phone}"
    tenant = _tenant_key(row.get("tenant") or "")
    if tenant and not tenant.startswith("مستأجر"):
        return f"t:{tenant}"
    return ""


def _is_generic_shop_unit(row: dict) -> bool:
    if row.get("unit_type") != "محل":
        return False
    unit = str(row.get("unit") or "")
    if unit in ("محل|pending",):
        return True
    no = str(row.get("unit_no") or "")
    if re.match(r"^\d+$", no):
        return False
    return _is_generic_shop_label(no) or _is_generic_shop_label(row.get("unit_raw") or "") or bool(
        re.match(r"^محل-(?:محل|دكان|shop)$", unit, re.I)
    )


def disambiguate_shop_unit_keys(rows: List[dict]) -> None:
    stable_to_unit: Dict[str, str] = {}
    seq = 0
    for row in rows:
        if not _is_generic_shop_unit(row):
            continue
        stable = _stable_shop_unit_id(row)
        if stable and stable in stable_to_unit:
            row["unit"] = stable_to_unit[stable]
            continue
        seq += 1
        if stable:
            unit_key = f"محل|{stable}"
            stable_to_unit[stable] = unit_key
            row["shop_needs_review"] = False
        else:
            unit_key = f"محل-{seq}"
            row["shop_needs_review"] = True
        row["unit"] = unit_key
        row["unit_no"] = str(seq)


def align_shop_units_across_parsed_rolls(parsed_rolls: List[dict]) -> None:
    stable_to_num: Dict[str, int] = {}
    orphan_fp: Dict[str, int] = {}
    order = 0
    for pr in parsed_rolls:
        for row in pr.get("rows") or []:
            if not _is_generic_shop_unit(row):
                continue
            stable = _stable_shop_unit_id(row)
            if stable and stable not in stable_to_num:
                order += 1
                stable_to_num[stable] = order
    for pr in parsed_rolls:
        for row in pr.get("rows") or []:
            if not _is_generic_shop_unit(row):
                continue
            stable = _stable_shop_unit_id(row)
            if stable and stable in stable_to_num:
                n = stable_to_num[stable]
                row["unit"] = f"محل-{n}"
                row["unit_no"] = str(n)
                row["shop_needs_review"] = False
                continue
            fp = f"{_tenant_key(row.get('tenant') or '')}|{row.get('rent') or 0}|{row.get('phone') or ''}"
            if fp not in orphan_fp:
                order += 1
                orphan_fp[fp] = order
            n = orphan_fp[fp]
            row["unit"] = f"محل-{n}"
            row["unit_no"] = str(n)
            row["shop_needs_review"] = True


def parse_unit_cell(raw: str, type_cell: str = "", tenant_hint: str = "") -> dict:
    """Normalize unit key — mirrors GAS parseUnitCell_ (shop vs apartment)."""
    raw = (raw or "").strip()
    type_cell = (type_cell or "").strip()
    tenant_hint = (tenant_hint or "").strip()
    unit_type = "شقة"
    combined = f"{raw} {type_cell} {tenant_hint}".lower()
    if re.search(r"(?:محل|دكان|shop|store|تجاري)", combined):
        unit_type = "محل"
    m = re.search(r"(\d+)", _norm_ar_nums(raw))
    unit_no = m.group(1) if m else raw
    if unit_no and _is_generic_shop_label(str(unit_no)):
        unit_no = ""
    if unit_type == "محل":
        unit_key = f"محل-{unit_no}" if unit_no else "محل|pending"
    else:
        unit_key = str(unit_no or raw or "")
    return {
        "unit": unit_key,
        "unit_no": unit_no,
        "unit_type": unit_type,
        "unit_raw": raw,
        "needs_shop_disambiguation": unit_type == "محل" and not unit_no,
    }


def parse_rent_roll_text(text: str, file_meta: dict) -> dict:
    text = _norm_ar_nums(text or "")
    if len(text) < 8:
        return {"ok": False, "error": "محتوى فارغ", "rows": [], "row_count": 0}

    lines = [ln for ln in text.splitlines() if ln.strip()]
    if len(lines) < 2:
        return {"ok": False, "error": "صفوف غير كافية", "rows": [], "row_count": 0}

    col_map: Optional[Dict[str, int]] = None
    header_idx = 0
    delim = ","
    for hi in range(min(8, len(lines))):
        delim = _detect_delimiter(lines[hi])
        reader = csv.reader(io.StringIO(lines[hi]), delimiter=delim)
        headers = next(reader, [])
        trial = _map_columns(headers)
        if trial.get("unit") is not None or trial.get("tenant") is not None:
            col_map = trial
            header_idx = hi
            break

    if not col_map:
        return {"ok": False, "error": "لم أتعرف على أعمدة الوحدة/المستأجر", "rows": [], "row_count": 0}

    rows: List[dict] = []
    for line in lines[header_idx + 1 :]:
        reader = csv.reader(io.StringIO(line), delimiter=delim)
        cells = next(reader, [])
        if not cells:
            continue
        unit_raw = _cell(cells, col_map.get("unit", -1))
        tenant = _cell(cells, col_map.get("tenant", -1))
        if not unit_raw and not tenant:
            continue
        if re.match(r"^(?:المجموع|total|إجمالي|sum)$", tenant, re.I):
            continue
        unit_info = parse_unit_cell(unit_raw, "", tenant)
        unit = unit_info["unit"]
        rent = _money(_cell(cells, col_map.get("rent", -1)))
        row = {
            "unit": unit,
            "unit_no": unit_info["unit_no"],
            "unit_type": unit_info["unit_type"],
            "unit_raw": unit_info["unit_raw"],
            "tenant": tenant or unit,
            "phone": _cell(cells, col_map.get("phone", -1)),
            "contract": _cell(cells, col_map.get("contract", -1)),
            "rent": rent,
            "pay_status": _cell(cells, col_map.get("pay_status", -1)),
            "late": _cell(cells, col_map.get("late", -1)),
            "paid": _money(_cell(cells, col_map.get("paid", -1))),
        }
        row["is_paid"] = _infer_paid(row)
        row["is_late"] = _infer_late(row)
        rows.append(row)

    name = file_meta.get("name") or ""
    month = extract_month(name) or int(file_meta.get("month") or 0)
    year = extract_year(name) or int(file_meta.get("year") or 2026)

    return {
        "ok": len(rows) > 0,
        "rows": rows,
        "row_count": len(rows),
        "month": month,
        "year": year,
        "file_name": name,
        "error": "" if rows else "لم أجد صفوف مستأجرين",
    }


def parse_expense_text(text: str, file_meta: dict) -> dict:
    text = _norm_ar_nums(text or "")
    lines = [ln for ln in text.splitlines() if ln.strip()]
    rows: List[dict] = []
    total = 0.0
    for line in lines[1:]:
        delim = _detect_delimiter(line)
        cells = next(csv.reader(io.StringIO(line), delimiter=delim), [])
        if len(cells) < 2:
            continue
        desc = cells[0].strip()
        amount = _money(cells[-1])
        if amount <= 0:
            continue
        unit = ""
        for c in cells[1:-1]:
            if re.search(r"\d|محل|شقة|unit", c, re.I):
                unit = c.strip()
                break
        rows.append({"description": desc, "unit": unit, "amount": amount, "category": "صيانة"})
        total += amount

    if not rows and text:
        for m in re.finditer(r"([\d,]+(?:\.\d+)?)\s*(?:ر\.?س|sar|aed|درهم)?", text):
            v = _money(m.group(1))
            if v > 50:
                rows.append({"description": "بند مصروف", "unit": "", "amount": v, "category": "مصروف"})
                total += v

    return {
        "ok": total > 0,
        "rows": rows[:50],
        "total": round(total, 2),
        "file_name": file_meta.get("name") or "",
        "row_count": len(rows),
    }
