from django import forms


class EmailContactForm(forms.Form):
    name = forms.CharField(max_length=25)
    email = forms.EmailField()
    message = forms.CharField(required=False, widget=forms.Textarea)