import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { policyContent } from "./policy-content";

interface LegalContentProps {
  activeSection: string;
}

export function LegalSidebar({ activeSection }: LegalContentProps) {
  const sections = Object.values(policyContent);
  return (
    <div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <li key={section.id}>
                <Link href={section.href}>
                  <Button
                    variant={isActive ? "outline" : "ghost"}
                    className="flex min-h-11 w-full items-center justify-start rounded-sm text-left text-xs"
                  >
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
