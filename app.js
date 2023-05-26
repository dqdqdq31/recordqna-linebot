/*
* Author : dqdqdq31 (dqdqdq31@gmail.com)
* Program Name : AutoRecordLineQnA
* Description: This is a LINE BOT to recore message containing keywords in google sheet. Based on App Script.
* Keyword:
*     [Question], [question], or [Q]:           store message containing one of these keywords in Q&A sheet question column
*     [Answer], [answer], [Ans], [ans], or [A]: store message containing one of these keywords in Q&A sheet answer column
*     [Info], [info], or [I]:                   store message containing one of these keywords in Info sheet information column
* LICENCE: Apache 2.0
* Contact: dqdqdq31@gmail.com
* Release : 2023 / 5 / 26
* Reference: https://github.com/jschang19/plusone-linebot
*/

function doPost(e) {
    // LINE Messenging API Token
    var CHANNEL_ACCESS_TOKEN = ''; // LINE Bot API Token
    // 以 JSON 格式解析 User 端傳來的 e 資料
    var msg = JSON.parse(e.postData.contents);

    // for debugging
    Logger.log(msg);
    console.log(msg);

    /* 
    * LINE API JSON 解析資訊
    *
    * replyToken : 一次性回覆 token
    * user_id : 使用者 user id，查詢 username 用
    * userMessage : 使用者訊息，用於判斷是否為預約關鍵字
    * event_type : 訊息事件類型
    */
    const replyToken = msg.events[0].replyToken;
    const user_id = msg.events[0].source.userId;
    const userMessage = msg.events[0].message.text;
    const event_type = msg.events[0].source.type;

    /*
    * Google Sheet 資料表資訊設定
    *
    * 將 sheet_url 改成你的 Google sheet 網址
    * 將 sheet_name 改成你的工作表名稱
    */
    const sheet_url = ''; // google sheet url
    const sheet_name_qa = 'Q&A';
    const SpreadSheet = SpreadsheetApp.openByUrl(sheet_url);
    const reserve_list_qa = SpreadSheet.getSheetByName(sheet_name_qa);
  
    const sheet_name_info = 'Info';
    const reserve_list_info = SpreadSheet.getSheetByName(sheet_name_info);

    // 必要參數宣告
    var current_date = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy-MM-dd"); // 取得執行時的當下日期
    var current_list_row_qa = reserve_list_qa.getLastRow(); // 取得工作表最後一欄（ 直欄數 ）
    var current_list_row_info = reserve_list_info.getLastRow(); // 取得工作表最後一欄（ 直欄數 ）
    var reply_message = []; // 空白回覆訊息陣列，後期會加入 JSON

    // 查詢傳訊者的 LINE 帳號名稱
    function get_user_name() {
        // 判斷為群組成員還是單一使用者
        switch (event_type) {
            case "user":
                var nameurl = "https://api.line.me/v2/bot/profile/" + user_id;
                break;
            case "group":
                var groupid = msg.events[0].source.groupId;
                var nameurl = "https://api.line.me/v2/bot/group/" + groupid + "/member/" + user_id;
                break;
        }

        try {
            //  呼叫 LINE User Info API，以 user ID 取得該帳號的使用者名稱
            var response = UrlFetchApp.fetch(nameurl, {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
                    "Content-Type": "application/json"
                },
            });
            var namedata = JSON.parse(response);
            var reserve_name = namedata.displayName;
        }
        catch {
            reserve_name = "not avaliable";
        }
        return String(reserve_name)
    }

    // 回傳訊息給line 並傳送給使用者
    function send_to_line() {
        var url = 'https://api.line.me/v2/bot/message/reply';
        UrlFetchApp.fetch(url, {
            'headers': {
                'Content-Type': 'application/json; charset=UTF-8',
                'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
            },
            'method': 'post',
            'payload': JSON.stringify({
                'replyToken': replyToken,
                'messages': reply_message,
            }),
        });
    }

    // 將輸入值 word 轉為 LINE 文字訊息格式之 JSON
    function format_text_message(word) {
        let text_json = [{
            "type": "text",
            "text": word
        }]

        return text_json;
    }
    
    var reserve_name = get_user_name();

    if (typeof replyToken === 'undefined') {
        return;
    };

    // google sheet content:
    // date, Questioner, Question, Respondent, Answer

    // record question
    if (userMessage.includes("[Question]") | userMessage.includes("[question]") | userMessage.includes("[Q]")) {
        reserve_list_qa.getRange(current_list_row_qa + 1, 1).setValue(current_date);
        reserve_list_qa.getRange(current_list_row_qa + 1, 2).setValue(reserve_name);
        reserve_list_qa.getRange(current_list_row_qa + 1, 3).setValue(userMessage);
        current_list_row_qa = reserve_list_qa.getLastRow();

        reply_message = format_text_message("Record Question");
        send_to_line()
    }

    // record answer
    else if (userMessage.includes("[Answer]") | userMessage.includes("[answer]") | userMessage.includes("[Ans]") | userMessage.includes("[ans]") | userMessage.includes("[A]")) {
        var reply = findReplyByReplyToken(replyToken);
        if (reply) {
            var originalMessage = reply.message;

        }


        reserve_list_qa.getRange(current_list_row_qa + 1, 1).setValue(current_date);
        reserve_list_qa.getRange(current_list_row_qa + 1, 4).setValue(reserve_name);
        reserve_list_qa.getRange(current_list_row_qa + 1, 5).setValue(userMessage);
        current_list_row_qa = reserve_list_qa.getLastRow();

        reply_message = format_text_message("Record Answer");
        send_to_line()
    }

    else if (userMessage.includes("[Info]") | userMessage.includes("[info]") | userMessage.includes("[I]")) {
        reserve_list_info.getRange(current_list_row_info + 1, 1).setValue(current_date);
        reserve_list_info.getRange(current_list_row_info + 1, 2).setValue(reserve_name);
        reserve_list_info.getRange(current_list_row_info + 1, 3).setValue(userMessage);
        current_list_row_info = reserve_list_info.getLastRow();

        reply_message = format_text_message("Record Info");
        send_to_line()
    }

    // show google sheet url
    else if (userMessage == "/QA" | userMessage == "/qa" | userMessage == "/Q&A" | userMessage == "/QnA") {
        reply_message = format_text_message(sheet_url);
        send_to_line();
    }

    // show help
    else if (userMessage == "/help" | userMessage == "/h") {
        var help_title  = "這是一個自動將問題與回答, 以及資訊存到google表單的BOT, 表單連結:\n";
        var help_sheet  =  sheet_url + "\n\n";

        var help_q      = "關鍵字: [Question] 或 [question] 或 [Q]\n";
        var help_qexp1  = "    訊息加入上述關鍵字, 以自動記錄到Q&A頁面的問題欄位, 並記錄日期跟提問者名稱\n";
        var help_qexp2  = "    範例:\n";
        var help_qexp3  = "    [Question]今天天氣如何?\n\n";

        var help_a      = "關鍵字: [Answer] 或 [answer] 或 [Ans] 或 [ans] 或 [A]\n";
        var help_aexp1  = "    訊息加入上述關鍵字, 以自動記錄到Q&A頁面的答案欄位, 並記錄日期跟提問者名稱\n";
        var help_aexp2  = "    範例:\n";
        var help_aexp3  = "    [Answer]陽光普照但我感冒還是穿外套\n\n";

        var help_i      = "關鍵字: [Info] 或 [info] 或 [I]\n";
        var help_iexp1  = "    訊息加入上述關鍵字, 以自動記錄到Info頁面的資訊欄位, 並記錄日期跟發訊者名稱\n";
        var help_iexp2  = "    範例:\n";
        var help_iexp3  = "    [Question]有批牛肉好便宜, 快打0912-3345678\n\n";

        var help_u      = "指令: /QA 或 /qa 或 /Q&A 或 /QnA\n"
        var help_uexp   = "    輸入指令以顯示google表單連結\n";
        var help_h      = "指令: /help 或 /h\n"
        var help_hexp   = "    輸入指令以顯示本說明\n";
        var help = help_title + help_sheet + help_q + help_qexp1 + help_qexp2 + help_qexp3 + help_a + help_aexp1 + help_aexp2 + help_aexp3 + help_i + help_iexp1 + help_iexp2 + help_iexp3 + help_u + help_uexp + help_h + help_hexp;
        reply_message = format_text_message(help);
        send_to_line();
    }

    // 其他非關鍵字的訊息則不回應（ 避免干擾群組聊天室 ）
    else {
        console.log("else here,nothing will happen.")
    }
}
