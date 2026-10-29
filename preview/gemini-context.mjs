// 送る内容の限定と返答の検査は cf-worker/src/gemini-tutor.mjs に一本化した（同じ処理を二重に持たない）。
export {explanationContext, explanationRequest, explanationResponse} from '../cf-worker/src/gemini-tutor.mjs';
