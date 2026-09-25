import { defineComponent, type PropType } from 'vue'
import type { ApiDocData, ApiMemberData } from 'virtual:source'
import { site } from '../lib/Source'
import s from './ApiDoc.module.scss'

const KIND_LABEL: Record<ApiDocData['kind'], string> = {
  class: 'Class 类',
  interface: 'Interface 接口',
  function: 'Function 函数',
  enum: 'Enum 枚举',
  'type-alias': 'Type Alias 类型别名',
  variable: 'Variable 变量',
}

/** section ids must match the urls generated in plugins/Docgen.ts (via toc) */
const sectionId = (data: ApiDocData, title: string): string | undefined =>
  data.toc.find((t) => t.title === title && t.depth === 2)?.url?.slice(1)

type ApiSig = NonNullable<ApiDocData['signatures']>[number]

const ParamTable = defineComponent({
  name: 'ApiParamTable',
  props: { sig: { type: Object as PropType<ApiSig>, required: true } },
  setup(props) {
    return () => {
      const sig = props.sig
      if (!sig.params.length && !sig.returns) return null
      return (
        <table class={s.table}>
          {sig.params.length > 0 && (
            <thead>
              <tr>
                <th>参数</th>
                <th>类型</th>
                <th>说明</th>
              </tr>
            </thead>
          )}
          <tbody>
            {sig.params.map((p) => (
              <tr key={p.name}>
                <td>{p.name}{!p.required && <span class={s.optional}>?</span>}</td>
                <td><code class={s.inlineCode}>{p.type}</code></td>
                <td>
                  {p.comment && <span>{p.comment}</span>}
                  {p.defaultValue != null && (
                    <span class={s.defaultVal}> 默认值：{p.defaultValue}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  },
})

const MemberBlock = defineComponent({
  name: 'ApiMemberBlock',
  props: { member: { type: Object as PropType<ApiMemberData>, required: true } },
  setup(props) {
    return () => {
      const m = props.member
      return (
        <div class={s.subSection} id={m.anchor}>
          <div class={s.memberHeader}>
            <h4>{m.name}</h4>
            <span class={s.memberBadges}>
              {m.static && <span class={s.badge}>static</span>}
              {m.readonly && <span class={s.badge}>readonly</span>}
              {m.required === false && <span class={s.badge}>optional</span>}
            </span>
          </div>
          {m.type && <pre class={s.code}><code>{`${m.name}${m.required === false ? '?' : ''}: ${m.type}`}</code></pre>}
          {m.signatures?.map((sig, i) => (
            <div key={i}>
              <pre class={s.code}><code>{sig.code}</code></pre>
              <ParamTable sig={sig} />
              {sig.returns && (
                <p class={s.returns}>
                  <strong>返回值：</strong>
                  <code class={s.inlineCode}>{sig.returns}</code>
                  {sig.returnsComment && <span> — {sig.returnsComment}</span>}
                </p>
              )}
            </div>
          ))}
          {m.defaultValue != null && m.kind === 'enum-member' && (
            <p class={s.returns}>
              <strong>值：</strong>
              <code class={s.inlineCode}>{m.defaultValue}</code>
            </p>
          )}
          {m.comment && <p class={s.summary}>{m.comment}</p>}
        </div>
      )
    }
  },
})

export const ApiDoc = defineComponent({
  name: 'ApiDoc',
  props: { data: { type: Object as PropType<ApiDocData>, required: true } },
  setup(props) {
    return () => {
      const d = props.data
      const idOverview = sectionId(d, '概述')
      const idSignatures = sectionId(d, '签名')
      const idCtor = sectionId(d, '构造函数')
      const idProps = sectionId(d, '属性')
      const idMethods = sectionId(d, '方法')
      const idMembers = sectionId(d, '成员')
      const idType = sectionId(d, '类型')
      const idExamples = sectionId(d, '示例')

      const ctors = (d.members ?? []).filter((m) => m.kind === 'constructor')
      const props2 = (d.members ?? []).filter(
        (m) => m.kind === 'property' || m.kind === 'get' || m.kind === 'set' || m.kind === 'index-signature',
      )
      const methods = (d.members ?? []).filter((m) => m.kind === 'method')
      const enumMembers = (d.members ?? []).filter((m) => m.kind === 'enum-member')

      return (
        <div>
          <p class={[s.kindBadge, d.kind === 'class' && s.kindClass]}>{KIND_LABEL[d.kind]}</p>
          {d.heritage && (
            <p class={s.heritage}>
              继承：{d.heritage.map((h, i) => (
                <span key={i}>
                  {i > 0 && ' · '}
                  <code class={s.inlineCode}>{h}</code>
                </span>
              ))}
            </p>
          )}

          {/* 概述 */}
          <section class={s.section} id={idOverview}>
            <h2>概述</h2>
            {d.summary && <p class={s.summary}>{d.summary}</p>}
            {d.remarks && <p class={s.summary}>{d.remarks}</p>}
            {d.typeParams && d.typeParams.length > 0 && (
              <p class={s.typeParams}>
                泛型参数：
                {d.typeParams.map((tp, i) => (
                  <span key={tp.name}>
                    {i > 0 && '、'}
                    <code class={s.inlineCode}>{tp.name}</code>
                    {tp.comment && `（${tp.comment}）`}
                  </span>
                ))}
              </p>
            )}
          </section>

          {/* 签名（函数 / 接口调用签名 / 访问器） */}
          {d.signatures && d.signatures.length > 0 && (
            <section class={s.section} id={idSignatures}>
              <h2>签名</h2>
              {d.signatures.map((sig, i) => (
                <div key={i}>
                  <pre class={s.code}><code>{sig.code}</code></pre>
                  <ParamTable sig={sig} />
                  {sig.returns && (
                    <p class={s.returns}>
                      <strong>返回值：</strong>
                      <code class={s.inlineCode}>{sig.returns}</code>
                      {sig.returnsComment && <span> — {sig.returnsComment}</span>}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* 类型（类型别名 / 变量） */}
          {d.type && (
            <section class={s.section} id={idType}>
              <h2>类型</h2>
              <pre class={s.code}><code>{`${d.name}${d.kind === 'variable' ? ': ' : ' = '}${d.type}`}</code></pre>
            </section>
          )}

          {/* 构造函数 / 属性 / 方法（class & interface） */}
          {ctors.length > 0 && (
            <section class={s.section} id={idCtor}>
              <h2>构造函数</h2>
              {ctors.map((m) => <MemberBlock key={m.anchor} member={m} />)}
            </section>
          )}
          {props2.length > 0 && (
            <section class={s.section} id={idProps}>
              <h2>属性</h2>
              {props2.map((m) => <MemberBlock key={m.anchor} member={m} />)}
            </section>
          )}
          {methods.length > 0 && (
            <section class={s.section} id={idMethods}>
              <h2>方法</h2>
              {methods.map((m) => <MemberBlock key={m.anchor} member={m} />)}
            </section>
          )}
          {enumMembers.length > 0 && (
            <section class={s.section} id={idMembers}>
              <h2>成员</h2>
              {enumMembers.map((m) => <MemberBlock key={m.anchor} member={m} />)}
            </section>
          )}

          {/* 示例 */}
          {d.examples && d.examples.length > 0 && (
            <section class={s.section} id={idExamples}>
              <h2>示例</h2>
              {d.examples.map((ex, i) => (
                <pre key={i} class={s.code}><code>{ex}</code></pre>
              ))}
            </section>
          )}

          {/* 源码位置 */}
          {d.sources && d.sources.length > 0 && site.editLink?.repo && (
            <p class={s.source}>
              源码：
              {d.sources.map((src, i) => (
                <span key={i}>
                  {i > 0 && '、'}
                  <a
                    class={s.sourceLink}
                    href={`https://github.com/${site.editLink?.repo}/blob/${site.editLink?.branch ?? 'main'}/${src.fileName}#L${src.line + 1}`}
                    target="_blank"
                    rel="noopener"
                  >
                    {src.fileName}:{src.line + 1}
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      )
    }
  },
})
