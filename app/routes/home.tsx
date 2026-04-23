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
    <HomeLayout {...baseOptions()}>
      <div className="relative w-full flex-1">
        <img
          src="/bg.jpeg"
          alt="Hero background"
          className="w-full h-full object-cover absolute inset-0"
        />
      </div>
    </HomeLayout>
  );
}
