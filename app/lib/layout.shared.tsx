import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (<>
        <span className=" font-medium in-[.uwu]:hidden">{appName}</span>
      </>),
      url: '/',
      transparentMode: "always",
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

