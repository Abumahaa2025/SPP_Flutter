import type { UploadResult } from '@/src/components/UploadResultCard';

export type PickedFile = { name: string; mimeType?: string; size?: number; uri?: string };

type Lang = 'en' | 'ar';

const MONTH_HINT = /(?:شهر|month|يناير|فبر|مار|أب|مايو|يون|jan|feb|mar|apr|may|jun)/i;

function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

export type PropertyDocType =
  | 'rent_roll'
  | 'maintenance'
  | 'expense'
  | 'contract'
  | 'comprehensive'
  | 'document';

function classifyPropertyDoc(name: string): { type: PropertyDocType; labelAr: string; labelEn: string; confidence: number } {
  const lower = name.toLowerCase();
  if (/(?:صيان|maint|repair|بلاغ)/.test(lower) && /(?:كشف|roll|xlsx|xls)/.test(lower)) {
    return { type: 'maintenance', labelAr: 'كشف صيانة', labelEn: 'Maintenance log', confidence: 88 };
  }
  if (/(?:مصروف|expense|فاتورة|invoice)/.test(lower) && !/(?:إيجار|rent roll)/.test(lower)) {
    return { type: 'expense', labelAr: 'كشف مصروفات', labelEn: 'Expense sheet', confidence: 86 };
  }
  if (/(?:كشف شامل|comprehensive|ملخص محفظة)/.test(lower)) {
    return { type: 'comprehensive', labelAr: 'كشف شامل', labelEn: 'Comprehensive statement', confidence: 90 };
  }
  if (/(?:كشف|roll|إيجار|ايجار|rent|تحصيل)/.test(lower) && (MONTH_HINT.test(lower) || /\.xlsx?$/.test(lower))) {
    return { type: 'rent_roll', labelAr: 'كشف إيجارات شهري', labelEn: 'Monthly rent roll', confidence: 90 };
  }
  if (/(?:عقد|contract|lease)/.test(lower)) {
    return { type: 'contract', labelAr: 'عقد إيجار', labelEn: 'Lease contract', confidence: 85 };
  }
  if (/\.xlsx?$/.test(lower)) {
    return { type: 'rent_roll', labelAr: 'جدول إيجارات', labelEn: 'Rent spreadsheet', confidence: 72 };
  }
  if (/\.pdf$/.test(lower)) {
    return { type: 'document', labelAr: 'مستند PDF', labelEn: 'PDF document', confidence: 65 };
  }
  return { type: 'document', labelAr: 'مستند عقاري', labelEn: 'Property document', confidence: 55 };
}

function buildResult(file: PickedFile, lang: Lang, index: number): UploadResult {
  const cls = classifyPropertyDoc(file.name);
  const type = lang === 'ar' ? cls.labelAr : cls.labelEn;
  const e = ext(file.name);
  const confidence = cls.confidence - index * 2;

  const summariesAr: Record<PropertyDocType, string> = {
    rent_roll: 'كشف إيجارات — وحدات، مستأجرون، مبالغ شهرية للربط مع الأشهر السابقة.',
    maintenance: 'كشف صيانة — بنود، وحدات، تكاليف — يُربط بالمستأجرين والعقارات.',
    expense: 'كشف مصروفات — فواتير وخدمات ومصاريف تشغيل.',
    contract: 'عقد إيجار — تواريخ، أطراف، قيمة — للتجديد والمتابعة.',
    comprehensive: 'كشف شامل — إيجارات ومصروفات وصيانة في ملف واحد.',
    document: 'مستند عقاري — يُصنّف ويُربط بالمحفظة.',
  };
  const actionsAr: Record<PropertyDocType, string> = {
    rent_roll: 'يُربط مع كشوف الأشهر الأخرى — مغادرون، متأخرون، تحصيل.',
    maintenance: 'يُستخرج أكثر بند تكرر وأكثر وحدة تكلفة.',
    expense: 'يُجمع مع الإيجار لحساب صافي الربح.',
    contract: 'راجع التجديد والتواريخ قبل الاعتماد.',
    comprehensive: 'يُفكّك إلى إيجار + مصروف + صيانة.',
    document: 'راجع الحقول ثم اعتمد بعد المراجعة.',
  };

  if (lang === 'ar') {
    return {
      id: `${Date.now()}-${index}`,
      fileName: file.name,
      sourceFile: file.name,
      documentType: type,
      summary: summariesAr[cls.type],
      detected: [
        `النوع: ${cls.labelAr}`,
        `الامتداد: .${e || '—'}`,
        file.size ? `الحجم: ${Math.round(file.size / 1024)} ك.ب` : 'الحجم: —',
      ],
      whyItMatters: 'كشوف العقار تغذّي التحصيل والصيانة والعقود — وليس مجرد رفع ملفات.',
      recommendedAction: actionsAr[cls.type],
      confidence: Math.max(55, Math.min(96, confidence)),
      linkedProperty: 'محفظة SPP',
    };
  }

  return {
    id: `${Date.now()}-${index}`,
    fileName: file.name,
    sourceFile: file.name,
    documentType: type,
    summary: `Property ${cls.labelEn} — linked to portfolio intake engine.`,
    detected: [`Type: ${cls.labelEn}`, `Ext: .${e || '—'}`],
    whyItMatters: 'Property statements drive collection, maintenance, and contract decisions.',
    recommendedAction: actionsAr[cls.type],
    confidence: Math.max(55, Math.min(96, confidence)),
    linkedProperty: 'SPP portfolio',
  };
}

/** Read CSV/TSV/text snippet for server-side parsing (no UI change). */
export async function readPropertyFileSnippet(file: PickedFile): Promise<string | undefined> {
  const lower = file.name.toLowerCase();
  if (!/\.(csv|txt|tsv)$/.test(lower) || !file.uri) return undefined;
  try {
    const res = await fetch(file.uri);
    const text = await res.text();
    return text.slice(0, 120_000);
  } catch {
    return undefined;
  }
}

/** Client-side preview — property doc classification. */
export async function analyzePickedFiles(files: PickedFile[], lang: Lang): Promise<UploadResult[]> {
  const delay = 500 + files.length * 140;
  await new Promise((r) => setTimeout(r, delay));
  return files.map((f, i) => buildResult(f, lang, i));
}

/** Build API payload with optional text snippets for deep parse. */
export async function buildUploadFileMeta(files: PickedFile[]) {
  return Promise.all(
    files.map(async (f) => {
      const textSnippet = await readPropertyFileSnippet(f);
      return {
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        ...(textSnippet ? { textSnippet } : {}),
      };
    }),
  );
}
