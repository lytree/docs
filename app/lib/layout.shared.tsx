import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';
import type { DocsLayoutProps } from 'fumadocs-ui/layouts/docs';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (<>
        <span className=" font-medium in-[.uwu]:hidden">{appName}</span>
      </>),
      url: '/',
    },
    links: [
      { text: 'java', url: '/docs/java/' },
      { text: 'dotnet', url: '/docs/dotnet/' },
      { text: '数据库', url: '/docs/db/' },
      {
        text: '中间件', url: '/docs/middleware/',

      },
      { text: '其他', url: '/docs/other/' },
      { text: '日记', url: 'https://blog.prideyang.top/', external: true },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,

  };

}

export const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  sidebar: {
    defaultOpenLevel: 1, // 默认展开层级
    collapsible: true, // 是否允许折叠
  },
  tree: undefined
};