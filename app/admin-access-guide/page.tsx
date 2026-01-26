"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Lock, Eye, AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function AdminAccessGuide() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IT Proctool Admin Access Guide</h1>
          <p className="text-gray-600">How to access the IT Proctool Admin Portal</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Access Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Admin Portal Access
              </CardTitle>
              <CardDescription>The admin portal is hidden and secure - follow these steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Direct URL Access</p>
                    <p className="text-sm text-gray-600">
                      Navigate directly to: <code className="bg-gray-100 px-2 py-1 rounded">/admin/secure-portal</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Use Admin Credentials</p>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Email: <code className="bg-gray-100 px-2 py-1 rounded">admin@itproctool.edu</code>
                      </p>
                      <p>
                        Password: <code className="bg-gray-100 px-2 py-1 rounded">SecureAdmin2024!</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Access Full Admin Features</p>
                    <p className="text-sm text-gray-600">Manage students, teachers, system settings, and view logs</p>
                  </div>
                </div>
              </div>

              <Link href="/admin/secure-portal">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Shield className="h-4 w-4 mr-2" />
                  Access Admin Portal
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Security Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Security Features
              </CardTitle>
              <CardDescription>Why the admin portal is hidden and secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded p-2">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Hidden from Public</p>
                    <p className="text-sm text-gray-600">No links on main pages</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-600 rounded p-2">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Authentication</p>
                    <p className="text-sm text-gray-600">Strong password requirements</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 text-purple-600 rounded p-2">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Activity Monitoring</p>
                    <p className="text-sm text-gray-600">All actions are logged</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 text-amber-600 rounded p-2">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Brute Force Protection</p>
                    <p className="text-sm text-gray-600">Login attempt monitoring</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access URLs */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Access URLs</CardTitle>
            <CardDescription>Direct links to different parts of the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Student Portal</h3>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Access Student Login
                  </Button>
                </Link>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Teacher Dashboard</h3>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Access Teacher Login
                  </Button>
                </Link>
              </div>

              <div className="text-center p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Admin Portal</h3>
                <Link href="/admin/secure-portal">
                  <Button className="w-full bg-red-600 hover:bg-red-700">Access Admin Portal</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Alert className="mt-8 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Security Notice:</strong> The admin portal is intentionally hidden from students and teachers. Only
            authorized administrators should access this area. All access attempts are monitored and logged.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
