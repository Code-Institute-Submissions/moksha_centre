var stripePublicKey = $('#id_stripe_public_key').text().slice(1, -1);
var clientSecret = $('#id_client_secret').text().slice(1, -1);
var stripe = Stripe(stripePublicKey);
var elements = stripe.elements();

var style = {
    base: {
        color: '#000',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
            color: '#aab7c4'
        }
    },
    invalid: {
        // Matches Bootstrap's text-danger class
        color: '#dc3545',
        iconColor: '#dc3545'
    }
};

var card = elements.create('card', {style: style});
card.mount('#card_element');

// Check for errors on data entry
card.addEventListener('change', function(event) {
    var errorDiv = document.getElementById('card_errors');
    if (event.error) {
        var html = `
            <span class="icon" role="alert">
                <i class="fas fa-times"></i>
            </span>
            <span>${event.error.message}</span>
        `;
        $(errorDiv).html(html);
    } else {
        errorDiv.textContent = '';
    }
});

var form = document.getElementById('payment_form');

form.addEventListener('submit', function(ev) {
    ev.preventDefault();
    card.update({'disabled': true});
    $('#submit_button').attr('disabled', true);
    $('#payment_form').fadeToggle(100);
    $('#loading-overlay').fadeToggle(100);

    var saveInfo = Boolean($('#save_info').attr('checked'));
    var csrfToken = $('input[name="csrfmiddlewaretoken"]').val();
    var postData = {
        'csrfmiddlewaretoken': csrfToken,
        'client_secret': clientSecret,
        'save_info': saveInfo,
    };
    var url = '/checkout/cache_checkout_data/';

    $.post(url, postData).done(function() {
        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: $.trim(form.full_name.value),
                    email: $.trim(form.email.value),
                    address: {
                        line1: $.trim(form.street_address1.value),
                        line2:$.trim(form.street_address2.value),
                        city: $.trim(form.town_or_city.value),
                        state: $.trim(form.county.value),
                        country: $.trim(form.country.value)
                    }
                }
            },
            shipping: {
                name: $.trim(form.full_name.value),
                address: {
                    line1: $.trim(form.street_address1.value),
                    line2:$.trim(form.street_address2.value),
                    city: $.trim(form.town_or_city.value),
                    state: $.trim(form.county.value),
                    country: $.trim(form.country.value),
                    postal_code: $.trim(form.postcode.value)
                }
            }
        }).then(function(result) {
            if (result.error) {
                var errorDiv = document.getElementById('card_errors');
                var html = `
                    <span class="icon" role="alert">
                        <i class="fas fa-times"></i>
                    </span>
                    <span>${result.error.message}</span>
                `;
                $(errorDiv).html(html);
                $('#payment_form').fadeToggle(100);
                $('#loading-overlay').fadeToggle(100);
                card.update({'disabled': false});
                $('#submit_button').attr('disabled', false);
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    form.submit();
                }
            }
        });
    }).fail(function() {
        // Reload the page, the error will be in Django messages
        location.reload()
    })

});