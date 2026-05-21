import { type FormEvent, useState } from "react";

interface AddItemFormProps {
  onAdd: (title: string, reason: string, startDate: string, targetDays: number) => Promise<void>;
  isAtLimit?: boolean;
  maxItems?: number;
  onNavigateToSettings?: () => void;
}

/** 今日の日付をYYYY-MM-DD形式で返す */
function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

const TARGET_DAYS_OPTIONS = [
  { value: 21, label: "21日（入門）", description: "シンプルな行動向け" },
  { value: 66, label: "66日（標準）", description: "Lally研究の平均値 ★推奨" },
  { value: 90, label: "90日（本格）", description: "複雑な習慣向け" },
] as const;

export function AddItemForm({ onAdd, isAtLimit = false, maxItems, onNavigateToSettings }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(todayString());
  const [targetDays, setTargetDays] = useState<number>(66);
  const [customDays, setCustomDays] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const effectiveTargetDays = useCustom ? (parseInt(customDays, 10) || 66) : targetDays;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reason.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim(), reason.trim(), startDate, effectiveTargetDays);
      setTitle("");
      setReason("");
      setStartDate(todayString());
      setTargetDays(66);
      setCustomDays("");
      setUseCustom(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (isAtLimit) {
    return (
      <div className="add-item-form plan-limit-notice">
        <p className="plan-limit-message">無料版は{maxItems}件までです</p>
        <button type="button" className="btn-upgrade" onClick={onNavigateToSettings}>アップグレード</button>
      </div>
    );
  }

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <h2 className="form-title">やらないことを追加</h2>

      <div className="form-field">
        <label htmlFor="title">やらないこと</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例: 深夜のSNS閲覧"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="reason">なぜやらないか</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="例: 睡眠の質が下がるため"
          required
          rows={2}
        />
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="start-date">開始日</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="target-days">習慣化目標期間</label>
          <div className="target-days-options">
            {TARGET_DAYS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`target-option ${!useCustom && targetDays === opt.value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="targetDays"
                  value={opt.value}
                  checked={!useCustom && targetDays === opt.value}
                  onChange={() => { setTargetDays(opt.value); setUseCustom(false); }}
                />
                <span className="option-label">{opt.label}</span>
                <span className="option-desc">{opt.description}</span>
              </label>
            ))}
            <label className={`target-option ${useCustom ? "selected" : ""}`}>
              <input
                type="radio"
                name="targetDays"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
              />
              <span className="option-label">カスタム</span>
              {useCustom && (
                <input
                  type="number"
                  className="custom-days-input"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="日数"
                  min={1}
                  max={365}
                />
              )}
            </label>
          </div>
          <p className="science-note">
            ※ UCL Lally研究(2010): 習慣化には平均66日かかる（範囲: 18〜254日）
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={submitting || !title.trim() || !reason.trim()}
      >
        {submitting ? "追加中..." : "追加する"}
      </button>
    </form>
  );
}
