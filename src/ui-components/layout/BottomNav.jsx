



export default function BottomNav({navItems,activeNav,setActiveNav}) {
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0
        h-14 bg-[var(--color-surface)]
        border-t border-[var(--color-border)]
        flex justify-around items-center
      "
    >
      {navItems.map(({ label, icon: Icon }) => (
        <button
          key={label}
          className="flex flex-col items-center text-xs text-muted-foreground"
          onClick={() => setActiveNav(label)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
