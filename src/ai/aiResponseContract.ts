// Shared by the initial prompt and the single format-recovery attempt.
// Keep all six sections required; malformed content must never become advice.
export const DEEP_ANALYSIS_FORMAT_RULES = `输出格式要求：
只输出一个有效 JSON 对象，不要 Markdown 代码块或 JSON 外的说明。
保持接口标记 success 为 true、type 为 "deep-analysis"。
业务内容放在 data 中或接口规定的根层，必须包含以下六个字段：
overview：非空字符串；
key_factors、risks、hidden_conflicts、scenarios、next_steps：字符串数组。
每个数组最多 3 项，每项简洁完整；没有依据时返回空数组，不要省略字段、使用 null 或编造内容。
保持本地结果不变，只解释已有结果。`
