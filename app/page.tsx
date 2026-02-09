import { redirect } from 'next/navigation';

// Redirect to planetqgames page - no menu entry needed
export default function Home() {
  redirect('/planetqgames');
}
