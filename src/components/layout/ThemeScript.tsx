import { getThemeInitScript } from '@/lib/theme';

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />;
}
