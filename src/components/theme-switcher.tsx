import { useTheme } from '../contexts/ThemeContext';
import { ThemeId } from '../types/theme';

export function ThemeSwitcher() {
  const { themeId, setTheme, availableThemes } = useTheme();

  const handleThemeChange = (newThemeId: ThemeId) => {
    setTheme(newThemeId);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary font-medium">Theme:</span>
      <select
        value={themeId}
        onChange={(e) => handleThemeChange(e.target.value as ThemeId)}
        className="bg-card-background border border-border rounded-md px-3 py-1 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
      >
        {availableThemes.map((theme) => (
          <option key={theme.id} value={theme.id} className="bg-background text-text">
            {theme.name}
          </option>
        ))}
      </select>
    </div>
  );
}
