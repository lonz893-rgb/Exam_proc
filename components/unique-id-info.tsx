import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, ArrowRight, Shield } from "lucide-react"

export function UniqueIdInfo() {
  return (
    <Card className="max-w-2xl mx-auto mt-8 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Key className="h-5 w-5" />
          How Unique Form IDs Work
        </CardTitle>
        <CardDescription className="text-blue-700">Direct access system for secure exam entry</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">Step 1</Badge>
            <span className="text-sm">Teacher creates exam and gets unique ID (e.g., MATH2024001)</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">Step 2</Badge>
            <span className="text-sm">Teacher shares unique ID with students</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-100 text-blue-800">Step 3</Badge>
            <span className="text-sm">Student enters Student ID, then unique Form ID</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800">Result</Badge>
            <span className="text-sm flex items-center gap-2">
              Direct access to proctored exam
              <ArrowRight className="h-4 w-4" />
              <Shield className="h-4 w-4" />
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-sm font-medium text-gray-800 mb-2">Sample Unique IDs:</p>
          <div className="space-y-1 text-xs font-mono">
            <div>MATH2024001 - Mathematics Final Exam</div>
            <div>PHYS2024002 - Physics Quiz</div>
            <div>CHEM2024003 - Chemistry Lab Report</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
