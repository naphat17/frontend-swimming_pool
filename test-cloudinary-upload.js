const fs = require('fs')
const FormData = require('form-data')
const fetch = require('node-fetch')
const path = require('path')

// Test Cloudinary upload functionality
async function testCloudinaryUpload() {
    console.log('🧪 Testing Cloudinary Upload Functionality...')
    
    try {
        // Step 1: Login as admin
        console.log('\n1. 🔐 Logging in as admin...')
        const loginResponse = await fetch('https://backend-l7q9.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        })
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`)
        }
        
        const loginData = await loginResponse.json()
        const token = loginData.token
        console.log('✅ Admin login successful')
        
        // Step 2: Create a test image file (simple base64 image)
        console.log('\n2. 📷 Creating test image...')
        const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        const testImageBuffer = Buffer.from(testImageBase64, 'base64')
        const testImagePath = path.join(__dirname, 'test-image.png')
        fs.writeFileSync(testImagePath, testImageBuffer)
        console.log('✅ Test image created')
        
        // Step 3: Test profile photo upload
        console.log('\n3. ⬆️ Testing profile photo upload to Cloudinary...')
        const formData = new FormData()
        formData.append('profile_photo', fs.createReadStream(testImagePath))
        
        const uploadResponse = await fetch('https://backend-l7q9.onrender.com/api/user/profile/upload-photo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            body: formData
        })
        
        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
        }
        
        const uploadData = await uploadResponse.json()
        console.log('✅ Profile photo upload successful!')
        console.log('📸 Cloudinary URL:', uploadData.profile_photo)
        
        // Step 4: Verify the uploaded image URL
        console.log('\n4. 🔍 Verifying Cloudinary URL...')
        if (uploadData.profile_photo && uploadData.profile_photo.includes('cloudinary.com')) {
            console.log('✅ Image successfully uploaded to Cloudinary!')
            console.log('🌐 URL format is correct')
        } else {
            console.log('❌ Image was not uploaded to Cloudinary')
            console.log('📄 Received URL:', uploadData.profile_photo)
        }
        
        // Step 5: Get user profile to verify the photo was saved
        console.log('\n5. 👤 Checking user profile...')
        const profileResponse = await fetch('https://backend-l7q9.onrender.com/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            console.log('✅ Profile retrieved successfully')
            console.log('📸 Profile photo URL in database:', profileData.user.profile_photo)
            
            if (profileData.user.profile_photo && profileData.user.profile_photo.includes('cloudinary.com')) {
                console.log('✅ Profile photo URL correctly saved to database!')
            } else {
                console.log('❌ Profile photo URL not properly saved')
            }
        }
        
        // Cleanup
        console.log('\n6. 🧹 Cleaning up...')
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath)
            console.log('✅ Test image file deleted')
        }
        
        console.log('\n🎉 Cloudinary upload test completed successfully!')
        
    } catch (error) {
        console.error('❌ Test failed:', error.message)
        
        // Cleanup on error
        const testImagePath = path.join(__dirname, 'test-image.png')
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath)
        }
    }
}

// Run the test
testCloudinaryUpload()