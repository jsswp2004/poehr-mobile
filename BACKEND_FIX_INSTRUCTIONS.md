# BACKEND FIX INSTRUCTIONS

#

# The appointment model/serializer is incorrectly using user_id instead of patient_id

#

# CURRENT BROKEN CODE (likely in appointments/serializers.py):

class AppointmentSerializer(serializers.ModelSerializer):
patient_name = serializers.SerializerMethodField()
provider_name = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        # BUG: This is using the User model directly by ID
        # instead of using the Patient foreign key relationship
        try:
            user = User.objects.get(id=obj.patient)  # ❌ WRONG!
            return f"{user.first_name} {user.last_name}"
        except User.DoesNotExist:
            return None

    def get_provider_name(self, obj):
        # Similar bug might exist here too
        try:
            user = User.objects.get(id=obj.provider)  # ❌ POTENTIALLY WRONG!
            return f"Dr. {user.first_name} {user.last_name}"
        except User.DoesNotExist:
            return None

# CORRECT FIXED CODE:

class AppointmentSerializer(serializers.ModelSerializer):
patient_name = serializers.SerializerMethodField()
provider_name = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        # FIX: Use the proper Patient model relationship
        if obj.patient:  # obj.patient is a Patient instance, not an ID
            return f"{obj.patient.first_name} {obj.patient.last_name}"
        return None

    def get_provider_name(self, obj):
        # FIX: Use the proper Doctor/Provider model relationship
        if obj.provider:  # obj.provider is a Doctor instance, not an ID
            return f"Dr. {obj.provider.first_name} {obj.provider.last_name}"
        return None

# ALTERNATIVE FIX (if the relationships are set up differently):

class AppointmentSerializer(serializers.ModelSerializer):
patient_name = serializers.SerializerMethodField()
provider_name = serializers.SerializerMethodField()

    def get_patient_name(self, obj):
        # FIX: Use the Patient model with the correct foreign key
        try:
            patient = Patient.objects.get(id=obj.patient_id)  # ✅ CORRECT!
            return f"{patient.first_name} {patient.last_name}"
        except Patient.DoesNotExist:
            return None

    def get_provider_name(self, obj):
        # FIX: Use the Doctor model with the correct foreign key
        try:
            doctor = Doctor.objects.get(id=obj.provider_id)  # ✅ CORRECT!
            return f"Dr. {doctor.first_name} {doctor.last_name}"
        except Doctor.DoesNotExist:
            return None

# MODELS TO CHECK (appointments/models.py):

class Appointment(models.Model): # Make sure these foreign keys are correct:
patient = models.ForeignKey(Patient, on_delete=models.CASCADE) # Should reference Patient model
provider = models.ForeignKey(Doctor, on_delete=models.CASCADE) # Should reference Doctor model # NOT: # patient = models.ForeignKey(User, on_delete=models.CASCADE) # ❌ WRONG!

    @property
    def patient_name(self):
        # If using property method, make sure it's correct:
        return f"{self.patient.first_name} {self.patient.last_name}"  # ✅ CORRECT
        # NOT:
        # return f"{self.patient.user.first_name} {self.patient.user.last_name}"  # ❌ WRONG

# QUICK TEST TO VERIFY THE FIX:

# After fixing, create an appointment with Patient ID 6 (John Smith)

# It should return patient_name = "John Smith", not "Michael Brown"
