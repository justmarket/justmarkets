function trigger_hj_stat(userId, statistics) {
    window.hj('identify', userId, {
        'registration_time': statistics.registration_time,
        'verification_time': statistics.verification_time,
        'verification_card_time': statistics.verification_card_time,
        'mt4_demo_account_count': statistics.mt4_demo_account_count,
        'mt4_real_account_count': statistics.mt4_real_account_count,
        'mt5_demo_account_count': statistics.mt5_demo_account_count,
        'mt5_real_account_count': statistics.mt5_real_account_count,
        'successful_deposits_count': statistics.successful_deposits_count,
        'unsuccessful_deposits_count': statistics.unsuccessful_deposits_count,
        'successful_withdrawals_count': statistics.successful_withdrawals_count,
        'unsuccessful_withdrawals_count': statistics.unsuccessful_withdrawals_count,
        'bonuses_count': statistics.bonuses_count,
        'contests_count': statistics.contests_count,
        'partner_registration_time': statistics.partner_registration_time,
        'partner_successful_withdrawals_count': statistics.partner_successful_withdrawals_count,
        'partner_unsuccessful_withdrawals_count': statistics.partner_unsuccessful_withdrawals_count
    });
}

// NOTE: body of this function copied from HJ docs, see git history how its modified.
//       Be aware that this function also used also in other files. Please use search when modify
function prepare_hj(h,o,hj_id){
    var t = 'https://static.hotjar.com/c/hotjar-';
    var j = '.js?sv=';
    h.hj=h.hj||function()
    {(h.hj.q=h.hj.q||[]).push(arguments)}
    ;
    h._hjSettings={hjid:hj_id,hjsv:6};
    var a=o.getElementsByTagName('head')[0];
    var r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
}

(function () {
    if(!!window.conversion_source_tracked) return;
    window.conversion_source_tracked = true;
    var searchParams = new URLSearchParams();
    searchParams.append('referer', document.referrer);
    searchParams.append('url', document.URL);
    searchParams.append('user_agent', navigator.userAgent);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/track_conversion?" + searchParams.toString(), true);
    xhr.timeout = 5000
    xhr.withCredentials = true;
    xhr.onload = function() {
        if (xhr.status !== 200) return;

        const storageKey = "visits";
        var jsonResponse = JSON.parse(xhr.responseText);
        if (jsonResponse.status !== "ok") return;

        if (jsonResponse.payload.redirect_to) {
            window.location.replace(jsonResponse.payload.redirect_to);
        }

        var user_visits = jsonResponse.payload.user_visits
        if (user_visits.length !== 0) {
            if (localStorage.getItem(storageKey)) {
                try {
                    var data = JSON.parse(localStorage.getItem(storageKey));
                    localStorage.setItem(
                        storageKey,
                        JSON.stringify(data.slice(-100).concat(user_visits))
                    );
                } catch (error) {
                    localStorage.setItem(storageKey, JSON.stringify(user_visits));
                }
            } else {
                localStorage.setItem(storageKey, JSON.stringify(user_visits));
            }
        }

        // clear local storage if signed in

        if (jsonResponse.payload.user_signed && localStorage.getItem(storageKey)) {
            var req = new XMLHttpRequest();
            req.open("POST", "/update_visits", true);
            req.timeout = 5000
            req.onload = function() { localStorage.removeItem(storageKey) };
            req.onerror = function(e) {
                var req = new XMLHttpRequest();
                req.open("POST", "/error_url", true);
                req.timeout = 5000
                req.send({
                    error_message: e.target.message,
                    url: document.URL,
                    script_location: e.target.filename,
                    line_no: e.target.lineNumber,
                    column_no: e.target.columnNumber,
                    backtrace: e.target.stack,
                    catched_by: 'catched by try/catch in user visits - "' + storageKey + '"'
                })
            }
            req.send()
        }

        // Hotjar data track
        // if hj script already called by monolit - we skip it
        if(jsonResponse.payload.hj && window.hj_data_after_track != 'already_tracked_by_gon') {
            var hj_data = jsonResponse.payload.hj;
            prepare_hj(window, document, hj_data['hj_id']);
            if(hj_data['hj_user_id']) trigger_hj_stat(hj_data['hj_user_id'], hj_data['hj_stat']);
        }
    };
    xhr.send();
})();
