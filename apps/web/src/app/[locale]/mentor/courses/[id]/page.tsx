import { CourseEditor } from "@/components/admin/CourseEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseEditor id={decodeURIComponent(id)} restricted />;
}
