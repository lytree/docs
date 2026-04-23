import type { Route } from './+types/home';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <img
        src="/bg.jpeg"
        alt="Hero background"
        className="w-full h-full object-cover absolute inset-0"
      />
      <HomeLayout {...baseOptions()}>
        <div className="flex-1" />
        <footer className="py-4 text-center text-sm text-fd-muted-foreground bg-white/70 dark:bg-black/70 backdrop-blur">
          © 2026 lytree. All rights reserved.
        </footer>
      </HomeLayout>
    </div>
  );
}
