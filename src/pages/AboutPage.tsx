import { BarChart3, Database, Dices, Orbit } from 'lucide-react'
import { usePlatform } from '../platform/PlatformContext'

export function AboutPage(): React.JSX.Element {
  const platform = usePlatform()
  if (platform === 'app') {
    return (
      <main className="mobile-about">
        <header className="mobile-destination-heading">
          <span>DECISION LAB</span>
          <h1>关于 Decision Lab</h1>
          <p>严肃界面，不太严肃的表达。我们负责计算，你负责停止纠结。</p>
        </header>
        <div className="mobile-about__version"><strong>版本 1.5.0</strong><span>Android App · 本地优先</span></div>
        <section className="mobile-about__cards">
          <article><Dices /><div><h2>随机模式</h2><p>等概率抽取，没有暗箱。</p></div></article>
          <article><BarChart3 /><div><h2>科学模式</h2><p>真实权重、评分与完整排名。</p></div></article>
          <article><Orbit /><div><h2>塔罗模式</h2><p>本地生成牌阵，始终明确仅供娱乐。</p></div></article>
          <article><Database /><div><h2>数据与隐私</h2><p>历史记录保存在当前设备；Web 与 App 不自动同步。</p></div></article>
        </section>
        <p className="mobile-about__note">AI 模式需要联网；随机、科学和塔罗模式不依赖 AI 服务。</p>
      </main>
    )
  }
  return (
    <main className="about-page">
      <header className="page-heading"><span className="section-index">ABOUT THE SYSTEM</span><h1>我们负责计算，<br />你负责停止纠结。</h1><p>DECISION LAB 是一个拥有明确人格的生活选择工具。第一版完全在浏览器中运行。</p></header>
      <section className="about-grid">
        <article><span className="about-icon about-icon--random"><Dices /></span><small>01 / RANDOM</small><h2>随机模式</h2><p>对每个有效候选项执行等概率抽取。没有暗箱，也没有系统偏爱。</p></article>
        <article><span className="about-icon about-icon--scientific"><BarChart3 /></span><small>02 / SCIENCE</small><h2>科学模式</h2><p>通过自定义指标、权重和 1～10 分评分，计算完整加权排名。</p></article>
        <article><span className="about-icon about-icon--mystic"><Orbit /></span><small>03 / MYSTIC</small><h2>玄学模式</h2><p>从 22 张大阿卡纳中展开 7 张，由你亲手抽牌。牌阵在本地生成，娱乐性质会始终明确标注。</p></article>
        <article><span className="about-icon about-icon--data"><Database /></span><small>PRIVACY / LOCAL</small><h2>只存本机</h2><p>历史记录使用 LocalStorage 保存。V1 没有账号、数据库或后端上传。</p></article>
      </section>
    </main>
  )
}
