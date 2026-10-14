import { cva, type VariantProps } from "class-variance-authority";
import React, { type ReactNode, ViewTransition } from "react";
import { cn } from "@/shared/utils/lib/utils";

interface ShellTypes {
  children: React.ReactNode;
}
interface ShellComponent extends ShellTypes {
  Main?: typeof Main;
  Aside?: typeof Aside;
  Footer?: typeof Footer;
  Header?: typeof Header;
  Section?: typeof Section;
}

export const Shell = ({ children }: ShellComponent) => {
  return <ViewTransition> {children}</ViewTransition>;
};

const HeaderVariants = cva("", {
  variants: {
    variant: {
      default: "fixed top-0 left-0 right-0 z-50 bg-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});
interface HeaderTypes {
  className?: string;
  children: ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderTypes & VariantProps<typeof HeaderVariants>>(
  ({ className, variant, ...props }, ref) => {
    return (
      <>
        <header ref={ref} {...props} className={cn(HeaderVariants({ variant }), className)} />
      </>
    );
  },
);
Header.displayName = "Header";
Shell.Header = Header;

interface AsideTypes {
  className?: string;
  children: ReactNode;
}

const Aside = React.forwardRef<HTMLElement, AsideTypes>(({ className, ...props }, ref) => {
  return <aside ref={ref} {...props} className={cn("border", className)} />;
});
Aside.displayName = "Aside";

Shell.Aside = Aside;

const FooterVariants = cva("", {
  variants: {
    variant: {
      default: "",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface FooterTypes {
  className?: string;
  children: ReactNode;
}

const Footer = React.forwardRef<HTMLElement, FooterTypes & VariantProps<typeof FooterVariants>>(
  ({ className, variant, ...props }, ref) => {
    return <footer ref={ref} {...props} className={cn(FooterVariants({ className, variant }), className)} />;
  },
);
Footer.displayName = "Footer";

Shell.Footer = Footer;

const MainVariants = cva("", {
  variants: {
    variant: {
      default: "min-h-screen min-w-0 overflow-x-clip pt-16 border-r",
      dashboard: "flex flex-1 h-screen overflow-hidden flex-col",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface MainTypes {
  className?: string;
  children: ReactNode;
}

const Main = React.forwardRef<HTMLElement, MainTypes & VariantProps<typeof MainVariants>>(
  ({ className, variant, ...props }, ref) => {
    return <main ref={ref} className={cn(MainVariants({ className, variant }), className)} {...props} />;
  },
);
Main.displayName = "Main";

Shell.Main = Main;

const SectionVariants = cva("", {
  variants: {
    variant: {
      default: "",
      full: "w-full h-full",
      flexed: "my-12 flex container mx-auto px-0 max-w-9xl ",
      dashboard: "flex-1 gap-0 bg-background",
      center: "flex min-h-svh flex-col items-center justify-center p-2 md:p-10",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface SectionTypes {
  className?: string;
  children: ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionTypes & VariantProps<typeof SectionVariants>>(
  ({ variant, className, ...props }, ref) => {
    return <section ref={ref} className={cn(SectionVariants({ variant, className }))} {...props} />;
  },
);
Section.displayName = "Section";

Shell.Section = Section;

export default Shell;
