import { APP_VERSION } from "../version";

const PRINCIPLES = [
  {
    title: "やることではなく、やらないこと",
    body: "To Doリストは「何をやるか」を増やしていく発想。NotToDoは逆に、時間と気力を奪っている習慣を「やめる」ことに焦点を当てます。",
  },
  {
    title: "理由とセットで記録する",
    body: "「なんとなく」ではなく、なぜそれをやめたいのかを言葉にして残す。理由が明確なほど、続けやすくなります。",
  },
  {
    title: "振り返って、自分を知る",
    body: "定期的に達成度を振り返ることで、自分の行動パターンが見えてくる。続かなかったものも、記録として意味を持ちます。",
  },
];

const STEPS = [
  {
    label: "01",
    title: "やらないことを決める",
    body: "やめたいこと・避けたいことをタイトルと理由とともに追加します。",
  },
  {
    label: "02",
    title: "期間を設定する",
    body: "開始日と目標日数を決めて、無理のないペースで習慣化を目指します。",
  },
  {
    label: "03",
    title: "振り返る",
    body: "定期的に達成度を記録し、自分の行動を見直すきっかけにします。",
  },
];

export function AboutPage() {
  return (
    <div className="app-shell lp-shell">
      <header className="app-bar">
        <div className="app-bar-brand">
          <div className="app-logo" aria-hidden="true">
            <span className="logo-icon">×</span>
          </div>
          <div className="app-title-area">
            <p className="app-eyebrow">Not To Do</p>
            <h1 className="app-title">やらないことリスト</h1>
          </div>
        </div>
        <a className="lp-nav-cta" href="/">
          アプリを開く
        </a>
      </header>

      <main className="lp-main">
        <section className="lp-hero">
          <p className="lp-eyebrow">やらないことリスト</p>
          <h2 className="lp-hero-title">
            増やすのは、やることじゃない。
            <br />
            減らすのは、やらないこと。
          </h2>
          <p className="lp-hero-lead">
            「やらない」と決めたことを理由とともに記録し、定期的な振り返りで習慣を見直すためのシンプルなWebアプリです。
          </p>
          <div className="lp-hero-actions">
            <a className="lp-btn-primary" href="/">
              今すぐはじめる
            </a>
          </div>
        </section>

        <section className="lp-section">
          <h3 className="lp-section-title">なぜ「やらないこと」なのか</h3>
          <div className="lp-card-grid">
            {PRINCIPLES.map((p) => (
              <div className="lp-card" key={p.title}>
                <h4 className="lp-card-title">{p.title}</h4>
                <p className="lp-card-body">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <h3 className="lp-section-title">使い方</h3>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div className="lp-step" key={s.label}>
                <span className="lp-step-label">{s.label}</span>
                <h4 className="lp-step-title">{s.title}</h4>
                <p className="lp-step-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-privacy">
          <h3 className="lp-section-title">データはあなたのブラウザだけに</h3>
          <p className="lp-privacy-body">
            NotToDoはサーバーを持たないアプリです。記録した内容はすべてお使いのブラウザのlocalStorageに保存され、外部に送信されることはありません。
          </p>
        </section>

        <section className="lp-cta-band">
          <h3 className="lp-cta-title">今日から、やらないことを決めよう</h3>
          <a className="lp-btn-primary" href="/">
            アプリを開く
          </a>
        </section>
      </main>

      <footer className="lp-footer">
        <p>NotToDo v{APP_VERSION}</p>
      </footer>
    </div>
  );
}
