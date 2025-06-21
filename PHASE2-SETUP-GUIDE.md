# PoEHR Mobile - Phase 2 Quick Start Guide

## 🏥 Setting Up Test Data for Appointments

To test the appointments functionality, you need patients and doctors in your Django backend.

### Option 1: Django Admin Panel (Recommended)

1. **Access Django Admin:**
   - Open your browser to `http://192.168.0.36:8000/admin/`
   - Login with your Django superuser account

2. **Create Test Users:**
   
   **For Patients:**
   - Go to "Users" → "Add User"
   - Username: `patient1`, `patient2`, etc.
   - Password: `testpass123`
   - Save and then edit:
     - First name: `John`, `Jane`, etc.
     - Last name: `Doe`, `Smith`, etc.
     - Email: `patient1@test.com`
     - In "User Profile" or custom fields, set role: `patient`

   **For Doctors:**
   - Go to "Users" → "Add User"  
   - Username: `doctor1`, `doctor2`, etc.
   - Password: `testpass123`
   - Save and then edit:
     - First name: `Dr. Sarah`, `Dr. Mike`, etc.
     - Last name: `Johnson`, `Wilson`, etc.
     - Email: `doctor1@test.com`
     - In "User Profile" or custom fields, set role: `doctor`

3. **Verify in Mobile App:**
   - Open the appointments screen
   - Tap "New Appointment"
   - You should now see patients and doctors in the dropdowns

### Option 2: Using Django Shell

If you prefer command line, you can create users via Django shell:

```python
# In your Django project directory
python manage.py shell

# Create test users
from django.contrib.auth.models import User
from myapp.models import UserProfile  # Adjust to your model

# Create a patient
patient = User.objects.create_user(
    username='patient1',
    email='patient1@test.com',
    password='testpass123',
    first_name='John',
    last_name='Doe'
)
# Set role if you have a profile model
# UserProfile.objects.create(user=patient, role='patient')

# Create a doctor
doctor = User.objects.create_user(
    username='doctor1', 
    email='doctor1@test.com',
    password='testpass123',
    first_name='Dr. Sarah',
    last_name='Johnson'
)
# UserProfile.objects.create(user=doctor, role='doctor')
```

### Testing the Appointments Flow

1. **Login as any user role**
2. **Go to Appointments tab**
3. **Select a date on the calendar**
4. **Tap "New Appointment"**
5. **Fill in the form:**
   - Select patient (if you're doctor/admin)
   - Select doctor (if you're patient/admin)
   - Choose time and duration
   - Add notes if needed
6. **Save the appointment**

### Demo Mode

The app includes demo mode when backend is unavailable:
- Shows helpful messages when no data is found
- Provides fallback UI for offline testing
- Displays setup instructions in the appointments screen

## 🎯 Next Steps

Once you have test data:
- ✅ Create appointments
- ✅ Edit appointments  
- ✅ Delete appointments
- ✅ Block dates (doctor/admin only)
- ✅ View appointments by date
- ✅ Role-based permissions work correctly

Ready to move to Phase 3! 🚀
