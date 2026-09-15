import * as React from "react";
import { ChevronDown, FileText } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ClientPage } from "@/lib/client-portal/tokens";

/**
 * One client's reports under their single URL (US-003).
 *
 * The tab value is the source of truth and both navigations drive it: the
 * sidebar buttons (which collapse to icon buttons with tooltips, so they
 * stay usable when the sidebar is collapsed) and the tab bar above the
 * report (which is always on screen, so collapsing the sidebar never
 * strands the reader with no way to switch reports).
 *
 * The sidebar report list sits inside a disclosure: closing it hides only
 * the sidebar copy of the navigation, never the tab bar. Every state of
 * the page — sidebar expanded or collapsed, disclosure open or closed —
 * keeps a working path between reports.
 */
export function ClientReports({
  page,
  defaultReportId,
}: {
  page: ClientPage;
  /**
   * The tab selected on first paint. Defaults to the client's first report;
   * a value naming no report falls back the same way. A seam for tests, so
   * both directions of the value-to-panel linkage are pinnable without a
   * browser.
   */
  defaultReportId?: string;
}) {
  const firstId = page.reports[0]?.id ?? "report";
  const [value, setValue] = React.useState(
    defaultReportId !== undefined &&
      page.reports.some((report) => report.id === defaultReportId)
      ? defaultReportId
      : firstId,
  );

  return (
    <Tabs value={value} onValueChange={setValue}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <p className="eyebrow group-data-[collapsible=icon]:hidden">Private client page</p>
            <p className="mt-1 text-sm font-medium group-data-[collapsible=icon]:hidden">
              {page.name}
            </p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroupLabel>
                  <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2">
                    <span>Reports</span>
                    <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {page.reports.map((report) => (
                        <SidebarMenuItem key={report.id}>
                          <SidebarMenuButton
                            isActive={report.id === value}
                            onClick={() => setValue(report.id)}
                            tooltip={report.title}
                          >
                            <FileText />
                            <span>{report.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="bg-transparent">
          <div className="mx-auto w-full max-w-[720px] px-6 py-12 sm:px-8">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <p className="eyebrow">Private client page</p>
            </div>
            <h1 className="type-h3-caps-light mt-3">{page.title}</h1>
            <TabsList className="mt-8 h-auto w-full flex-wrap justify-start">
              {page.reports.map((report) => (
                <TabsTrigger key={report.id} value={report.id}>
                  {report.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {page.reports.map((report) => (
              <TabsContent key={report.id} value={report.id}>
                <article className="mt-8">
                  <h2 className="type-h4-caps">{report.title}</h2>
                  <div
                    className="mt-6 max-w-[58ch] space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80"
                    dangerouslySetInnerHTML={{ __html: report.html }}
                  />
                </article>
              </TabsContent>
            ))}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </Tabs>
  );
}
