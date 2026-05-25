import type { NotToDoItem, ReviewRecord, UserPlan } from "../types";
import { DataManager } from "./DataManager";
import { UpgradePrompt } from "./UpgradePrompt";

interface SettingsPanelProps {
  plan: UserPlan;
  itemCount: number;
  items: NotToDoItem[];
  reviews: ReviewRecord[];
  onImportComplete: () => Promise<void>;
}

export function SettingsPanel({
  plan,
  itemCount,
  items,
  reviews,
  onImportComplete,
}: SettingsPanelProps) {
  const handleLogin = () => {
    window.alert("近日公開です");
  };

  return (
    <>
      <div className="settings-panel">
        <h2>設定</h2>
        <div className="account-info">
          <h3>アカウント</h3>
          <p>ローカルで利用中です</p>
          <button type="button" onClick={handleLogin}>
            ログイン
          </button>
        </div>
        <div className="plan-info">
          <h3>プラン</h3>
          <p>現在のプラン: {plan.plan}</p>
          <p>
            アイテム数: {itemCount} / {plan.maxItems}
          </p>
        </div>
        <div className="data-info">
          <h3>データ</h3>
          <p className="settings-desc">バックアップの保存・読み込み、JSON形式でのエクスポート・インポートができます。</p>
          <DataManager items={items} reviews={reviews} onImportComplete={onImportComplete} />
        </div>
      </div>
      <UpgradePrompt plan={plan.plan} />
    </>
  );
}
