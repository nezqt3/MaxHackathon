import { AnimatePresence, motion } from "motion/react";
import { UserIcon, CartIcon, CategoriesIcon, Bookmark2Icon, CalendarIcon } from "../static/MenuBarIcons";

export const MENU_ITEMS = [
  { key: "schedule", Icon: CalendarIcon },
  { key: "services", Icon: Bookmark2Icon },
  { key: "news", Icon: CategoriesIcon },
  { key: "projects", Icon:  CartIcon },
  { key: "account", Icon: UserIcon },
];

const ACTIVE_COLOR = "#3673ff";
const INACTIVE_COLOR = "#9CA3AF";

const MenuBar = ({ activeItem, onChange = () => {} }) => (
  <nav className="menu-bar">
    {MENU_ITEMS.map(({ key, label, Icon }) => {
      const isActive = key === activeItem;
      const iconColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

      return (
        <button
          type="button"
          key={key}
          className={`menu-bar__button${isActive ? " menu-bar__button--active" : ""}`}
          onClick={() => onChange(key)}
        >
          <div className="menu-bar__icon-wrapper">
            <Icon size={28} stroke={iconColor} strokeWidth={isActive ? 2.4 : 2} />
            <AnimatePresence>
              {isActive && (
                <motion.span
                  className="menu-bar__indicator"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  style={{ backgroundColor: iconColor, transformOrigin: "center" }}
                />
              )}
            </AnimatePresence>
          </div>
          <span className="menu-bar__label">{label}</span>
        </button>
      );
    })}
  </nav>
);

export default MenuBar;
