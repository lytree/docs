import type { Route } from './+types/home';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: '杨 ◦ 柳' },
    { name: 'description', content: '杨 ◦ 柳' },
  ];
}

export default function Home() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <img
        src="/main.png"
        className="w-full h-full object-cover absolute inset-0 opacity-20 -z-10"
      />
      <HomeLayout {...baseOptions()}>
        <div className="flex-1" />
        <footer className="backdrop-blur-lg border-t transition-colors *:mx-auto *:max-w-(--fd-layout-width) py-4 text-center text-sm">
          © 2026 lytree. All rights reserved.
        </footer>
      </HomeLayout>
    </div>
  );
}
