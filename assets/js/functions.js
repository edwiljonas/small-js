/************************
 * GLOBALS
 ************************/
var global_json;

/************************
 * INSTANTIATE
 ************************/
jQuery(function(){

    //FORCE INT
    jQuery('#total_number').on('keydown keyup paste', function(event){
        force_integer(this);
    });

    //SET WRAPPER
    set_wrapper();

    //ENABLE JSON
    setup_json();

});

/************************
 * JSON SETUP
 ************************/
function setup_json(){

    var json_string = '{' +
        '"status": "true",' +
        '"accounts": [' +
                '{' +
                    '"id": "1",' +
                    '"type": "current",' +
                    '"name": "Current Account",' +
                    '"balance": 3500,' +
                    '"overdraft": 100000,' +
                    '"minimum": 0, ' +
                    '"history": []'+
                '},' +
                '{' +
                    '"id": "2",' +
                    '"type": "savings",' +
                    '"name": "Savings Account",' +
                    '"balance": 2450,' +
                    '"overdraft": 0,' +
                    '"minimum": 1000, ' +
                    '"history": []'+
                '},' +
                '{' +
                    '"id": "3",' +
                    '"type": "current",' +
                    '"name": "Current Account",' +
                    '"balance": 3500,' +
                    '"overdraft": 100000,' +
                    '"minimum": 0, ' +
                    '"history": []'+
                '},' +
                '{' +
                    '"id": "4",' +
                    '"type": "savings",' +
                    '"name": "Savings Account",' +
                    '"balance": 3500,' +
                    '"overdraft": 0,' +
                    '"minimum": 1000, ' +
                    '"history": []'+
                '}' +
            ']'+
        '}';

    global_json = JSON.parse(json_string);

    /* THIS WOULD NORMALLY COME FROM A AJAX CALL CONNECTING WITH BACKEND LOGIC */
    output_data(global_json);

}

/************************
 * OUTPUT
 ************************/
function output_data(global_json){

    //CLEAR
    jQuery('.summary').html('');

    //SETUP DATA
    var html = '';

    //LOOP THROUGH DATA
    jQuery(global_json.accounts).each(function(index, value){

        html += '<div class="summary_row">';
            html += '<div class="view" title="View history" data-index="'+index+'" data-toggle="open"></div>';
            html += '<div class="col_1">'+value.id+'</div>';
            html += '<div class="col_3">'+value.name+'</div>';
            if(value.type === 'savings'){
                html += '<div class="col_3">R '+jQuery.number(value.balance, 2)+'</div>';
            } else if(value.type === 'current'){
                html += '<div class="col_3">R '+jQuery.number(value.balance, 2)+'</div>';
            }
            html += '<div class="options">';
                html += '<div class="btn" data-id="'+value.id+'" data-index="'+index+'" data-overdraft="'+value.overdraft+'" data-balance="'+value.balance+'" data-action="withdraw" data-type="'+value.type+'" data-id="'+value.id+'">Withdraw</div>';
                html += '<div class="btn" data-id="'+value.id+'" data-index="'+index+'" data-overdraft="'+value.overdraft+'" data-balance="'+value.balance+'" data-action="deposit" data-type="'+value.type+'" data-id="'+value.id+'">Deposit</div>';
            html += '</div>';
        html += '</div>';
        html += '<div class="history_holder" data-link="'+index+'">';
            html += '<div class="col_12">Transaction History</div>';
            html += '<div class="history_items"></div>';
        html += '</div>';

    });

    //ADD HTML TO DOCUMENT
    jQuery('.summary').append(html);

    //ENABLE OPTIONS
    enable_options();

}

/************************
 * ENABLE OPTIONS
 ************************/
function enable_options(){

    //ENABLE DEPOSIT AND WITHDRAW
    jQuery('.btn').off().on('click', function(){

        //VARIABLES
        var type = jQuery(this).attr('data-type');
        var action = jQuery(this).attr('data-action');
        var name = jQuery(this).attr('data-name');
        var index = parseInt(jQuery(this).attr('data-index'));

        //SET POPUP HEADING
        if(type == 'current' || type == 'savings'){
            popup_toggle('show');
            jQuery('.popup_close').off().on('click', function(){jQuery('.popup').hide();});
            jQuery('.popup_heading').html(global_json.accounts[index].name + ' - ' + action);
        }

        switch(type){
            case 'current':
                run_calculations(index, action);
                break;
            case 'savings':
                run_calculations(index, action);
                break;
        }

    });

    //ENABLE HISTORY
    jQuery('.view').off().on('click', function() {

        var index = parseInt(jQuery(this).attr('data-index'));
        var toggle = jQuery(this).attr('data-toggle');

        if(toggle === 'open'){
            jQuery("[data-link="+index+"]").find('.history_items').html('');
            jQuery("[data-link="+index+"]").show();
            jQuery(this).attr('data-toggle', 'close');
        } else {
            jQuery("[data-link="+index+"]").find('.history_items').html('');
            jQuery("[data-link="+index+"]").hide();
            jQuery(this).attr('data-toggle', 'open');
        }

        output_history(global_json, index);

    });

}

/************************
 * HISTORY OUTPUT
 ************************/
function output_history(global_json, index){

    html = '';

    if(global_json.accounts[index].history.length != 0){

        jQuery(global_json.accounts[index].history).each(function(index, value){

            html += '<div class="history_row">';
                if(value.action === 'deposit'){
                    html += '<div class="col_3">R '+jQuery.number(value.total, 2)+'</div>';
                } else {
                    html += '<div class="col_3">- R '+jQuery.number(value.total, 2)+'</div>';
                }
                html += '<div class="col_3">'+value.type+'</div>';
                html += '<div class="col_3">'+value.action+'</div>';
            html += '</div>';

        });

    } else {
        html += '<div class="history_row">';
            html += '<div class="col_3">History not available</div>';
        html += '</div>';
    }

    jQuery("[data-link="+index+"]").find('.history_items').html(html);

}

/************************
 * CALCULATIONS
 ************************/
function run_calculations(index, action){

    jQuery('.complete_transaction').off().on('click', function(){

        var type = global_json.accounts[index].type;
        var minimum = global_json.accounts[index].minimum;
        var balance = global_json.accounts[index].balance;
        var overdraft = global_json.accounts[index].overdraft;
        var total = jQuery('#total_number').val();
        var funds_remaining = +(balance) + overdraft;

        if(total !== ''){

            switch(action){
                case 'withdraw': //WITHDRAW

                    var remainder;

                    if(type === 'savings'){ //SAVINGS
                        remainder = balance - total;
                        if(total > balance){
                            error_flag('error', 'Insufficient funds');
                        } else if(remainder < minimum){
                            error_flag('error', 'A Minimum of R' + jQuery.number(minimum, 2) + ' is required with this account.');
                        } else {
                            //HIDE
                            popup_toggle('hide');
                            //SET BALANCE
                            global_json.accounts[index].balance = remainder;
                            //RELOAD
                            output_data(global_json);
                            //SUCCESS
                            error_flag('success', 'A total of R' + jQuery.number(total, 2) + ' was withdrawn.');
                            //PUSH HISTORY
                            push_history(index, total, type, 'withdraw');
                        }
                    } else if(type === 'current'){
                        remainder = funds_remaining - total;
                        balance = balance - total;
                        if(remainder <= 0){
                            error_flag('error', 'Overdraft limit exceeded.');
                        } else {
                            //HIDE
                            popup_toggle('hide');
                            //SET BALANCE
                            global_json.accounts[index].balance = balance;
                            //RELOAD
                            output_data(global_json);
                            //SUCCESS
                            error_flag('success', 'A total of R' + jQuery.number(total, 2) + ' was withdrawn.');
                            //PUSH HISTORY
                            push_history(index, total, type, 'withdraw');
                        }
                    }

                    break;
                case 'deposit': //DEPOSIT
                    if(type === 'savings' || type === 'current') { //SAVINGS
                        //HIDE
                        popup_toggle('hide');
                        //SET BALANCE
                        global_json.accounts[index].balance = balance + parseInt(total);
                        //RELOAD
                        output_data(global_json);
                        //SUCCESS
                        error_flag('success', 'A total of R' + jQuery.number(total, 2) + ' was deposited.');
                        //PUSH HISTORY
                        push_history(index, total, type, 'deposit');
                    }
                    break;
            }

        } else {

            error_flag('error', 'Please enter a value.');

        }

    });

}

/************************
 * HISTORY
 ************************/
function  push_history(index, total, type, action){

    var history = '{' +
            '"status": "true",' +
            '"total": "'+total+'",' +
            '"action": "'+action+'",' +
            '"type": "'+type+'"' +
        '}';

    var parse_history = JSON.parse(history);

    global_json.accounts[index].history.push(parse_history);

}

/************************
 * FLAG SETUP
 ************************/
function error_flag(type, message){

    //VARIABLES
    var notice_flag = jQuery('.notice_holder')

    //SET TYPE
    jQuery(notice_flag).attr('data-type', type);

    //SET MESSAGE
    switch (type){
        case 'error':
            jQuery(notice_flag).html(message);
            break;
        case 'success':
            jQuery(notice_flag).html(message);
            break;
    }

    //REMOVE TYPE
    setTimeout(function(){ jQuery(notice_flag).attr('data-type', '') }, 3000);

}

/************************
 * WRAPPER SETUP
 ************************/
function set_wrapper(){

    var window_height = jQuery(window).height();
    jQuery('.popup').height(window_height);

    jQuery(window).on('resize', function(){

        window_height = jQuery(window).height();
        jQuery('.popup').height(window_height);

    });

}

/************************
 * POPUP
 ************************/
function popup_toggle(status){
    switch(status){
        case 'hide':
            jQuery('.popup').hide();
            break;
        case 'show':
            jQuery('.popup').show();
            jQuery('.popup').find('#total_number').val('').focus();
            break;
    }
}

/************************
 * FORCE INT
 ************************/
function force_integer(object){
    var val = jQuery(object).val();
    if(!/^[0-9]+$/.test(val)){
        jQuery(object).val(jQuery(object).val().replace(/[^0-9]/g, ''));
    }
}