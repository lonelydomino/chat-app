export default function TestImagePage() {
  const testImageUrl = '/api/uploads/f2740164-b4cb-446c-a35b-f9e3800c695c.png'
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Profile Image Test</h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Test Image Display</h2>
            <div className="flex items-center space-x-4">
              <img
                src={testImageUrl}
                alt="Test Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <div>
                <p className="text-sm text-gray-600">Image URL:</p>
                <p className="font-mono text-xs bg-gray-100 p-2 rounded">{testImageUrl}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-3">Image Info</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>File:</strong> f2740164-b4cb-446c-a35b-f9e3800c695c.png</p>
              <p><strong>Path:</strong> uploads/f2740164-b4cb-446c-a35b-f9e3800c695c.png</p>
              <p><strong>API Endpoint:</strong> /api/uploads/f2740164-b4cb-446c-a35b-f9e3800c695c.png</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-3">Test Links</h2>
            <div className="space-y-2">
              <a 
                href={testImageUrl} 
                target="_blank" 
                className="block text-blue-600 hover:underline"
              >
                Open Image in New Tab
              </a>
              <a 
                href="/uploads/f2740164-b4cb-446c-a35b-f9e3800c695c.png" 
                target="_blank" 
                className="block text-red-600 hover:underline"
              >
                Test Old URL (should fail)
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
