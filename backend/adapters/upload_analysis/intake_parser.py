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
    # Strip tatweel + normalize hamza forms so real owner headers match.
    text = (text or "").replace("\u0640", "")
    text = (
        text.replace("أ", "ا")
        .replace("إ", "ا")
        .replace("آ", "ا")
        .replace("ة", "ه")
    )
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


COLUMN_FIELDS = ("unit", "tenant", "rent", "phone", "contract", "pay_status", "paid", "late")


def _column_labels(headers: List[str], col_map: Dict[str, int]) -> Dict[str, str]:
    labels: Dict[str, str] = {}
    for key, idx in col_map.items():
        if 0 <= idx < len(headers):
            labels[key] = headers[idx].strip()
    return labels


def _column_confidence(col_map: Dict[str, int]) -> float:
    """Heuristic confidence — no AI, used by understanding layer."""
    if col_map.get("unit") is None and col_map.get("tenant") is None:
        return 0.0
    score = 40.0
    if col_map.get("unit") is not None:
        score += 20.0
    if col_map.get("tenant") is not None:
        score += 20.0
    for key in ("rent", "pay_status", "phone", "contract"):
        if col_map.get(key) is not None:
            score += 5.0
    return min(100.0, score)


def _map_columns(headers: List[str]) -> Dict[str, int]:
    col: Dict[str, int] = {}
    for i, h in enumerate(headers):
        hl = _norm_ar_nums(h.strip().lower())
        if not hl:
            continue
        # Prefer specific rent-roll labels over generic «حالة/مبلغ» (often electricity).
        if any(k in hl for k in ("رقم الشقه", "رقم الشقة", "وحده", "وحدة", "unit", "شقه", "شقة", "محل", "office", "apt")):
            if "ايجار" not in hl and "rent" not in hl:
                col.setdefault("unit", i)
        if any(k in hl for k in ("مستاجر", "مستأجر", "tenant", "الاسم", "اسم", "name")) and "عقد" not in hl:
            col.setdefault("tenant", i)
        if any(
            k in hl
            for k in (
                "ايجار الشقه",
                "ايجار الشقة",
                "قيمه الايجار",
                "قيمة الإيجار",
                "ايجار",
                "إيجار",
                "rent",
            )
        ) and "مدفوع" not in hl and "شهرمدفوع" not in hl.replace(" ", ""):
            col.setdefault("rent", i)
        if any(k in hl for k in ("جوال", "phone", "mobile", "هاتف", "رقم الجوال")):
            col.setdefault("phone", i)
        if any(k in hl for k in ("رقم العقد", "رقـم العقد", "عقد", "contract")) and "حالة" not in hl and "حاله" not in hl:
            col.setdefault("contract", i)
        if any(k in hl for k in ("سداد", "payment", "تحصيل", "حاله الدفع", "حالة الدفع", "pay status")):
            col.setdefault("pay_status", i)
        if "حاله العقد" in hl or "حالة العقد" in hl:
            pass  # contract status — not payment status
        elif any(k in hl for k in ("حاله", "حالة", "status")) and "عقد" not in hl and "فاتوره" not in hl and "فاتورة" not in hl:
            col.setdefault("pay_status", i)
        if any(k in hl for k in ("اجمالي المتاخرات", "اجمالي المتأخرات", "متأخر", "late", "delay", "overdue")):
            col.setdefault("late", i)
        if any(k in hl for k in ("ايجار شهرمدفوع", "ايجار شهر مدفوع", "مدفوع", "paid amount", "محصل")) and "فاتوره" not in hl and "فاتورة" not in hl:
            col.setdefault("paid", i)
            if "pay_status" not in col:
                col.setdefault("pay_status", i)
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


# قواعد عامة — هوية الوحدة (أي عميل، أي تنسيق أعمدة)
COMMERCIAL_UNIT_KEYWORDS = [
    "محل", "دكان", "مكتب", "مستودع", "معرض", "كراج", "مخزن", "تجاري",
    "shop", "store", "office", "warehouse", "commercial", "retail", "boutique", "showroom", "garage", "unit",
]
RESIDENTIAL_UNIT_KEYWORDS = [
    "شقة", "وحدة", "استوديو", "غرفة",
    "apt", "apartment", "studio", "flat", "room",
]
GENERIC_UNIT_LABELS = COMMERCIAL_UNIT_KEYWORDS + RESIDENTIAL_UNIT_KEYWORDS
COMMERCIAL_TYPE_CANONICAL = {
    "shop": "محل", "store": "محل", "retail": "محل", "boutique": "محل", "دكان": "محل", "تجاري": "محل",
    "office": "مكتب", "مكتب": "مكتب",
    "warehouse": "مستودع", "مستودع": "مستودع", "مخزن": "مستودع", "storehouse": "مستودع",
    "showroom": "معرض", "معرض": "معرض",
    "garage": "كراج", "كراج": "كراج",
    "commercial": "تجاري", "unit": "وحدة",
}


def _match_unit_keyword(text: str, keywords: List[str]) -> str:
    text = (text or "").strip().lower()
    if not text:
        return ""
    for kw in keywords:
        if text == kw.lower():
            return kw
    return ""


def _text_mentions_commercial_keyword(text: str) -> str:
    text = (text or "").strip().lower()
    if not text:
        return ""
    for kw in COMMERCIAL_UNIT_KEYWORDS:
        low = kw.lower()
        if text == low or text.startswith(low) or re.search(rf"(?:^|\s){re.escape(low)}", text, re.I):
            return kw
    return ""


def _canonical_commercial_type(keyword: str) -> str:
    if not keyword:
        return "محل"
    return COMMERCIAL_TYPE_CANONICAL.get(keyword.lower(), keyword)


def _is_generic_unit_label(text: str) -> bool:
    return bool(_match_unit_keyword(text, GENERIC_UNIT_LABELS))


def _is_generic_shop_label(text: str) -> bool:
    return _is_generic_unit_label(text)


def _detect_commercial_unit_type(raw: str, type_cell: str = "", tenant_hint: str = "") -> str:
    for part in (raw, type_cell, tenant_hint):
        hit = _text_mentions_commercial_keyword(part)
        if hit:
            return _canonical_commercial_type(hit)
    return ""


def _is_commercial_unit_type(unit_type: str) -> bool:
    return bool((unit_type or "").strip()) and unit_type != "شقة"


def _unit_type_prefix(row: dict) -> str:
    if _is_commercial_unit_type(row.get("unit_type") or ""):
        return str(row.get("unit_type"))
    return "وحدة"


def _tenant_key(name: str) -> str:
    return "".join((name or "").lower().split())


def _stable_unit_identity_key(row: dict) -> str:
    """Stable identity for linking the same physical unit across months.

    For numbered apartments/units: contract → phone → tenant (unchanged).
    For ambiguous commercial labels (raw «محل» without number): prefer tenant(+phone)
    over contract so a contract renewal does not invent a 5th shop.
    """
    tenant = _tenant_key(row.get("tenant") or "")
    phone = (row.get("phone") or "").strip()
    contract = (row.get("contract") or "").strip()
    unit_no = str(row.get("unit_no") or "").strip()
    ambiguous_commercial = _is_commercial_unit_type(row.get("unit_type") or "") and (
        bool(row.get("needs_unit_disambiguation") or row.get("needs_shop_disambiguation"))
        or _is_generic_unit_label(row.get("unit_raw") or "")
        or _is_generic_unit_label(unit_no)
        or not unit_no
        or str(row.get("unit") or "").endswith("|pending")
    )
    if ambiguous_commercial:
        if tenant and not tenant.startswith("مستأجر"):
            if len(phone) >= 8:
                return f"t:{tenant}|p:{phone}"
            return f"t:{tenant}"
        if len(phone) >= 8:
            return f"p:{phone}"
        if contract and len(contract) > 2 and contract.lower() not in ("بدون", "لا", "none", "-"):
            return f"c:{contract}"
        return ""

    if contract and len(contract) > 2 and contract.lower() not in ("بدون", "لا", "none", "-"):
        return f"c:{contract}"
    if len(phone) >= 8:
        return f"p:{phone}"
    if tenant and not tenant.startswith("مستأجر"):
        return f"t:{tenant}"
    return ""


_stable_shop_unit_id = _stable_unit_identity_key


def _is_ambiguous_unit(row: dict) -> bool:
    if row.get("needs_unit_disambiguation") or row.get("needs_shop_disambiguation"):
        return True
    no = str(row.get("unit_no") or "")
    if re.match(r"^\d+$", no):
        return False
    if _is_generic_unit_label(no) or _is_generic_unit_label(row.get("unit_raw") or ""):
        return True
    unit = str(row.get("unit") or "")
    if unit.endswith("|pending"):
        return True
    prefix = _unit_type_prefix(row)
    if prefix and re.match(rf"^{re.escape(prefix)}-{re.escape(prefix)}$", unit, re.I):
        return True
    return _is_commercial_unit_type(row.get("unit_type") or "") and not no


_is_generic_shop_unit = _is_ambiguous_unit


def _mark_unit_review_flag(row: dict, needs_review: bool) -> None:
    row["unit_needs_review"] = needs_review
    row["shop_needs_review"] = needs_review


def disambiguate_ambiguous_unit_keys(rows: List[dict]) -> None:
    stable_to_unit: Dict[str, str] = {}
    seq = 0
    for row in rows:
        if not _is_ambiguous_unit(row):
            continue
        prefix = _unit_type_prefix(row)
        stable = _stable_unit_identity_key(row)
        if stable and stable in stable_to_unit:
            row["unit"] = stable_to_unit[stable]
            continue
        seq += 1
        if stable:
            unit_key = f"{prefix}|{stable}"
            stable_to_unit[stable] = unit_key
            _mark_unit_review_flag(row, False)
        else:
            unit_key = f"{prefix}-{seq}"
            _mark_unit_review_flag(row, True)
        row["unit"] = unit_key
        row["unit_no"] = str(seq)
        row["needs_unit_disambiguation"] = False
        row["needs_shop_disambiguation"] = False


disambiguate_shop_unit_keys = disambiguate_ambiguous_unit_keys


def align_ambiguous_units_across_parsed_rolls(parsed_rolls: List[dict]) -> None:
    stable_to_num: Dict[str, int] = {}
    orphan_fp: Dict[str, int] = {}
    order = 0
    for pr in parsed_rolls:
        for row in pr.get("rows") or []:
            if not _is_ambiguous_unit(row):
                continue
            stable = _stable_unit_identity_key(row)
            if stable and stable not in stable_to_num:
                order += 1
                stable_to_num[stable] = order
    for pr in parsed_rolls:
        for row in pr.get("rows") or []:
            if not _is_ambiguous_unit(row):
                continue
            prefix = _unit_type_prefix(row)
            stable = _stable_unit_identity_key(row)
            if stable and stable in stable_to_num:
                n = stable_to_num[stable]
                row["unit"] = f"{prefix}-{n}"
                row["unit_no"] = str(n)
                _mark_unit_review_flag(row, False)
                row["needs_unit_disambiguation"] = False
                row["needs_shop_disambiguation"] = False
                continue
            fp = f"{_tenant_key(row.get('tenant') or '')}|{row.get('rent') or 0}|{row.get('phone') or ''}"
            if fp not in orphan_fp:
                order += 1
                orphan_fp[fp] = order
            n = orphan_fp[fp]
            row["unit"] = f"{prefix}-{n}"
            row["unit_no"] = str(n)
            _mark_unit_review_flag(row, True)
            row["needs_unit_disambiguation"] = False
            row["needs_shop_disambiguation"] = False


align_shop_units_across_parsed_rolls = align_ambiguous_units_across_parsed_rolls


def parse_unit_cell(raw: str, type_cell: str = "", tenant_hint: str = "") -> dict:
    """Normalize unit key — universal rules for residential/commercial labels."""
    raw = (raw or "").strip()
    type_cell = (type_cell or "").strip()
    tenant_hint = (tenant_hint or "").strip()
    commercial_type = _detect_commercial_unit_type(raw, type_cell, tenant_hint)
    unit_type = commercial_type or "شقة"
    m = re.search(r"(\d+)", _norm_ar_nums(raw))
    unit_no = m.group(1) if m else raw
    if unit_no and _is_generic_unit_label(str(unit_no)):
        unit_no = ""
    if unit_type != "شقة":
        unit_key = f"{unit_type}-{unit_no}" if unit_no else f"{unit_type}|pending"
    else:
        unit_key = str(unit_no or raw or "")
    needs_disambiguation = not unit_no and (
        _is_generic_unit_label(raw) or _is_commercial_unit_type(unit_type)
    )
    return {
        "unit": unit_key,
        "unit_no": unit_no,
        "unit_type": unit_type,
        "unit_raw": raw,
        "needs_unit_disambiguation": needs_disambiguation,
        "needs_shop_disambiguation": needs_disambiguation,
    }


def parse_rent_roll_text(text: str, file_meta: dict) -> dict:
    text = _norm_ar_nums(text or "")
    if len(text) < 8:
        return {"ok": False, "error": "محتوى فارغ", "rows": [], "row_count": 0}

    lines = [ln for ln in text.splitlines() if ln.strip()]
    if len(lines) < 2:
        return {"ok": False, "error": "صفوف غير كافية", "rows": [], "row_count": 0}

    col_map: Optional[Dict[str, int]] = None
    headers: List[str] = []
    header_idx = 0
    delim = ","
    for hi in range(min(8, len(lines))):
        delim = _detect_delimiter(lines[hi])
        reader = csv.reader(io.StringIO(lines[hi]), delimiter=delim)
        trial_headers = next(reader, [])
        trial = _map_columns(trial_headers)
        if trial.get("unit") is not None or trial.get("tenant") is not None:
            col_map = trial
            headers = list(trial_headers)
            header_idx = hi
            # Merge next 1–2 label rows (common in Arabic owner sheets) for phone/rent gaps
            for extra in range(1, 3):
                if hi + extra >= len(lines):
                    break
                extra_cells = next(csv.reader(io.StringIO(lines[hi + extra]), delimiter=delim), [])
                if not extra_cells:
                    continue
                # Stop merging once a data row starts (numeric first cell / known tenant-like)
                first = (extra_cells[0] or "").strip()
                if first.isdigit() and int(first) < 200:
                    break
                extra_map = _map_columns(extra_cells)
                for key, idx in extra_map.items():
                    if key not in col_map and 0 <= idx < len(extra_cells):
                        col_map[key] = idx
                        while len(headers) <= idx:
                            headers.append("")
                        if not headers[idx]:
                            headers[idx] = extra_cells[idx]
                header_idx = hi + extra
            break

    if not col_map:
        return {
            "ok": False,
            "error": "لم أتعرف على أعمدة الوحدة/المستأجر",
            "rows": [],
            "row_count": 0,
            "headers": [],
            "column_map": {},
            "column_labels": {},
            "column_confidence": 0.0,
        }

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
        "headers": headers,
        "column_map": col_map,
        "column_labels": _column_labels(headers, col_map),
        "column_confidence": _column_confidence(col_map),
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
