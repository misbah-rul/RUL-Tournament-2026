import { Skeleton } from "@/components/ui/skeleton";
import { Container } from "../layout/Container";
import { PageHeader } from "./PageHeader";

export function LoadingSkeleton() {
  return (
    <div className="w-full">
      <PageHeader title="Loading..." />
      <Container className="py-8 space-y-6">
        <Skeleton className="h-12 w-full max-w-[250px]" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Container>
    </div>
  );
}
