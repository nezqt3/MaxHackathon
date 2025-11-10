import { UserIcon, CartIcon, CategoriesIcon, Bookmark2Icon, CalendarIcon } from "../static/MenuBarIcons";

export const MENU_ITEMS = [
  { key: "schedule", Icon: CalendarIcon },
  { key: "services", Icon: Bookmark2Icon },
  { key: "news", Icon: CategoriesIcon },
  { key: "projects", Icon:  CartIcon },
  { key: "account", Icon: UserIcon },
];

const MenuBar = ({ activeItem, onChange = () => {} }) => (
  <nav className="menu-bar">
    {MENU_ITEMS.map(({ key, label, Icon }) => {
      const isActive = key === activeItem;

      return (
        <button
          type="button"
          key={key}
          className={`menu-bar__button${isActive ? " menu-bar__button--active" : ""}`}
          onClick={() => onChange(key)}
        >
          <Icon size={28} stroke={isActive ? "#004CFF" : "#9CA3AF"} strokeWidth={isActive ? 2.4 : 2} />
          <span className="menu-bar__label">{label}</span>
        </button>
      );
    })}
  </nav>
);

export default MenuBar;
