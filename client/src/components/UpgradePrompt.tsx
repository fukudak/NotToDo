interface UpgradePromptProps {
  plan: string;
}

export function UpgradePrompt({ plan }: UpgradePromptProps) {
  const isPro = plan === "pro";

  const handleDummy = () => {
    window.alert("近日公開です");
  };

  if (isPro) {
    return (
      <div className="settings-panel upgrade-prompt">
        <p>あなたは有料版です</p>
      </div>
    );
  }

  return (
    <div className="settings-panel upgrade-prompt">
      <h3>プランをアップグレード</h3>
      <div className="plan-comparison">
        <div className="plan-tier plan-free">
          <h4>無料版</h4>
          <ul>
            <li>3件まで</li>
            <li>エクスポート不可</li>
          </ul>
        </div>
        <div className="plan-tier plan-pro">
          <h4>有料版</h4>
          <ul>
            <li>無制限</li>
            <li>エクスポート/インポート</li>
            <li>優先サポート</li>
          </ul>
        </div>
      </div>
      <div className="upgrade-actions">
        <button type="button" className="btn-upgrade" onClick={handleDummy}>
          アップグレード
        </button>
        <button type="button" className="btn-restore" onClick={handleDummy}>
          復元購入
        </button>
      </div>
    </div>
  );
}
