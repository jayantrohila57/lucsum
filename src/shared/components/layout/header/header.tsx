import { HeaderCommerceActions, HeaderUtilityActions } from "./header.actions";
import HeaderLogo from "./header.logo";
import { MobileNavButton, MobileNavProvider } from "./header.mobile-navigation";
import { NavigationMenuComponent } from "./header.navigation";

export default function Header() {
  return (
    <MobileNavProvider>
      <nav className="z-50 flex h-16 w-full items-center justify-between border-b border-r bg-background/50 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 flex-row items-stretch">
          <div className="flex h-full shrink-0 flex-row items-center border-r bg-secondary px-3 py-2 sm:px-6 md:px-8">
            <HeaderLogo />
          </div>
          <div className="hidden h-full min-w-0 md:flex md:flex-row md:items-center">
            <NavigationMenuComponent />
          </div>
        </div>
        <div className="flex h-full shrink-0 items-stretch">
          <HeaderCommerceActions />
          <div className="flex items-center border-l md:hidden">
            <div className="flex h-full min-h-11 items-center px-1 sm:px-2">
              <MobileNavButton />
            </div>
          </div>
          <div className="hidden md:flex">
            <HeaderUtilityActions />
          </div>
        </div>
      </nav>
    </MobileNavProvider>
  );
}
