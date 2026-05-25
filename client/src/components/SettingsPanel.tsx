import type { NotToDoItem, UserPlan } from "../types";
import { UpgradePrompt } from "./UpgradePrompt";

interface SettingsPanelProps {
  plan: UserPlan;
  itemCount: number;
}

export function SettingsPanel({ plan, itemCount }: SettingsPanelProps) {
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
      </div>
      <UpgradePrompt plan={plan.plan} />
    </>
  );
}
