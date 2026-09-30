import { RotateCcw, TriangleAlert } from 'lucide-react'
import { Component } from 'react'
import type { ErrorInfo, PropsWithChildren } from 'react'

interface ErrorBoundaryProps extends PropsWithChildren {
  /** 出错时用于回退的标题，默认面向通用页面。 */
  title?: string
  /** 出错时的说明文案。 */
  description?: string
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * 兜住渲染期抛出的异常。
 *
 * 决策引擎在渲染阶段构造结果（分析页需要立刻拿到 winner 播动画），
 * 一旦某个选项无法映射，异常会直接冒泡成白屏。这里至少给用户一条出路。
 *
 * 注意：不使用 useContext，因此不能调用 usePlatform。回退界面用普通的
 * section 元素包裹，并由 CSS 同时适配 Web 与移动端，避免为兜底界面
 * 引入平台分支。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('DECISION LAB 渲染失败', error, info.componentStack)
  }

  private readonly reset = (): void => {
    this.setState({ error: null })
  }

  private readonly goHome = (): void => {
    window.location.hash = '#/'
    window.location.reload()
  }

  render(): React.ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <section className="error-fallback" role="alert">
        <span className="error-fallback__icon">
          <TriangleAlert size={24} aria-hidden="true" />
        </span>
        <h1>{this.props.title ?? '这次分析没能完成'}</h1>
        <p>
          {this.props.description
            ?? '系统在生成结果时遇到了意外情况，本次决定没有被记录。'}
        </p>
        <div className="error-fallback__actions">
          <button type="button" onClick={this.reset}>
            <RotateCcw size={16} aria-hidden="true" />
            重试一次
          </button>
          <button type="button" onClick={this.goHome}>返回首页</button>
        </div>
      </section>
    )
  }
}
