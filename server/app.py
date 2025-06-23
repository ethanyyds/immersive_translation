import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# 腾讯云 SDK 导入
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.tmt.v20180321 import tmt_client, models

# 加载 .env 文件中的环境变量
load_dotenv()

app = Flask(__name__)
# 允许所有来源的跨域请求，方便插件调用
CORS(app)

# 从环境变量获取密钥
SECRET_ID = os.getenv("TENCENTCLOUD_SECRET_ID")
SECRET_KEY = os.getenv("TENCENTCLOUD_SECRET_KEY")

def get_tencent_translate(text, source='auto', target='zh'):
    """使用腾讯云官方 SDK 调用翻译API"""
    if not SECRET_ID or not SECRET_KEY:
        return {"error": "未配置腾讯云密钥"}

    try:
        # 实例化一个认证对象
        cred = credential.Credential(SECRET_ID, SECRET_KEY)
        
        # 实例化一个http选项
        httpProfile = HttpProfile()
        httpProfile.endpoint = "tmt.tencentcloudapi.com"

        # 实例化一个client选项
        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        
        # 实例化要请求产品的client对象
        client = tmt_client.TmtClient(cred, "ap-guangzhou", clientProfile)

        # 实例化一个请求对象
        req = models.TextTranslateRequest()
        params = {
            "SourceText": text,
            "Source": source,
            "Target": target,
            "ProjectId": 0
        }
        req.from_json_string(json.dumps(params))

        # 返回的resp是一个TextTranslateResponse的实例
        resp = client.TextTranslate(req)
        
        # 将响应转换为字典格式
        response_dict = json.loads(resp.to_json_string())
        return response_dict

    except TencentCloudSDKException as err:
        print(f"腾讯云SDK异常: {err}")
        return {"error": str(err)}
    except Exception as e:
        print(f"其他异常: {e}")
        return {"error": str(e)}

@app.route("/translate", methods=["POST"])
def translate_endpoint():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "请求参数错误，需要 'text' 字段"}), 400
    
    text_to_translate = data["text"]
    result = get_tencent_translate(text_to_translate)
    
    # 解析腾讯云返回的结果
    if "TargetText" in result:
        return jsonify({"translatedText": result["TargetText"]})
    elif "Response" in result and "TargetText" in result["Response"]:
        return jsonify({"translatedText": result["Response"]["TargetText"]})
    else:
        # 如果腾讯云返回错误，也将其返回给前端
        error_msg = result.get("error", "翻译失败")
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    # 默认运行在 5000 端口
    app.run(debug=True, port=5000) 