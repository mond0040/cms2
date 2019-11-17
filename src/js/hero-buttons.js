(function($, Drupal, window, document) {
    'use strict';
    
    Drupal.behaviors.heroButtons = {
        attach: function(context, settings) {
            if (typeof context['location'] !== 'undefined') {  
                const buttons = $('.hero__button-item');

                $.each(buttons, function (index, element) { 
                    let typeElement = $(element).find('.hero__button-type');
                    let type = $(typeElement)[0].innerText.trim();

                    if (type == 'Green Filled') {
                        $(element).find('.hero__button-link').addClass('btn-primary-filled');
                    } else {
                        $(element).find('.hero__button-link').addClass('btn-primary-outline');
                    }

                    $(typeElement).remove();
                });
            }
        }
    };
    
})(jQuery, Drupal, this, this.document);
