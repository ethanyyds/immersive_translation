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

def get_tencent_translate_batch(texts, source='auto', target='zh'):
    """使用腾讯云官方 SDK 批量翻译文本"""
    if not SECRET_ID or not SECRET_KEY:
        return {"error": "未配置腾讯云密钥"}

    if not texts or len(texts) == 0:
        return {"translatedTexts": []}

    # 腾讯云批量翻译限制：单次请求总长度不超过6000字符
    # 为了安全起见，我们设置为5000字符
    MAX_BATCH_LENGTH = 5000
    
    def split_texts_by_length(text_list):
        """按字符长度分割文本列表"""
        batches = []
        current_batch = []
        current_length = 0
        
        for text in text_list:
            text_length = len(text)
            # 如果单个文本就超过限制，跳过它
            if text_length > MAX_BATCH_LENGTH:
                print(f"警告：单个文本长度 {text_length} 超过限制，跳过")
                continue
            
            # 如果加上当前文本会超过限制，先处理当前批次
            if current_length + text_length > MAX_BATCH_LENGTH and current_batch:
                batches.append(current_batch)
                current_batch = [text]
                current_length = text_length
            else:
                current_batch.append(text)
                current_length += text_length
        
        # 处理最后一个批次
        if current_batch:
            batches.append(current_batch)
        
        return batches

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

        # 分批处理文本
        text_batches = split_texts_by_length(texts)
        all_translated_texts = []
        
        print(f"将 {len(texts)} 个文本分为 {len(text_batches)} 批次处理")
        
        for i, batch in enumerate(text_batches):
            print(f"处理第 {i+1}/{len(text_batches)} 批次，包含 {len(batch)} 个文本")
            
            # 实例化一个批量翻译请求对象
            req = models.TextTranslateBatchRequest()
            params = {
                "Source": source,
                "Target": target,
                "ProjectId": 0,
                "SourceTextList": batch
            }
            req.from_json_string(json.dumps(params))

            # 返回的resp是一个TextTranslateBatchResponse的实例
            resp = client.TextTranslateBatch(req)
            
            # 将响应转换为字典格式
            response_dict = json.loads(resp.to_json_string())
            
            # 提取翻译结果
            if "TargetTextList" in response_dict:
                all_translated_texts.extend(response_dict["TargetTextList"])
            elif "Response" in response_dict and "TargetTextList" in response_dict["Response"]:
                all_translated_texts.extend(response_dict["Response"]["TargetTextList"])
            else:
                print(f"批次 {i+1} 翻译失败")
        
        return {"TargetTextList": all_translated_texts}

    except TencentCloudSDKException as err:
        print(f"腾讯云SDK异常: {err}")
        return {"error": str(err)}
    except Exception as e:
        print(f"其他异常: {e}")
        return {"error": str(e)}

@app.route("/translate", methods=["POST"])
def translate_endpoint():
    data = request.get_json()
    if not data:
        return jsonify({"error": "请求参数错误"}), 400
    
    # 支持单个文本翻译（向后兼容）
    if "text" in data:
        text_to_translate = data["text"]
        result = get_tencent_translate_batch([text_to_translate])
        
        # 解析单个翻译结果
        if "TargetTextList" in result and len(result["TargetTextList"]) > 0:
            return jsonify({"translatedText": result["TargetTextList"][0]})
        elif "Response" in result and "TargetTextList" in result["Response"] and len(result["Response"]["TargetTextList"]) > 0:
            return jsonify({"translatedText": result["Response"]["TargetTextList"][0]})
        else:
            error_msg = result.get("error", "翻译失败")
            return jsonify({"error": error_msg}), 500
    
    # 支持批量文本翻译
    elif "texts" in data:
        texts_to_translate = data["texts"]
        if not isinstance(texts_to_translate, list):
            return jsonify({"error": "texts 参数必须是数组"}), 400
        
        result = get_tencent_translate_batch(texts_to_translate)
        
        # 解析批量翻译结果
        if "TargetTextList" in result:
            return jsonify({"translatedTexts": result["TargetTextList"]})
        elif "Response" in result and "TargetTextList" in result["Response"]:
            return jsonify({"translatedTexts": result["Response"]["TargetTextList"]})
        else:
            error_msg = result.get("error", "批量翻译失败")
            return jsonify({"error": error_msg}), 500
    
    else:
        return jsonify({"error": "请求参数错误，需要 'text' 或 'texts' 字段"}), 400

@app.route("/translate-batch", methods=["POST"])
def translate_batch_endpoint():
    """专门的批量翻译接口"""
    data = request.get_json()
    if not data or "texts" not in data:
        return jsonify({"error": "请求参数错误，需要 'texts' 字段"}), 400
    
    texts_to_translate = data["texts"]
    if not isinstance(texts_to_translate, list):
        return jsonify({"error": "texts 参数必须是数组"}), 400
    
    result = get_tencent_translate_batch(texts_to_translate)
    
    # 解析批量翻译结果
    if "TargetTextList" in result:
        return jsonify({"translatedTexts": result["TargetTextList"]})
    elif "Response" in result and "TargetTextList" in result["Response"]:
        return jsonify({"translatedTexts": result["Response"]["TargetTextList"]})
    else:
        error_msg = result.get("error", "批量翻译失败")
        return jsonify({"error": error_msg}), 500

if __name__ == "__main__":
    # 默认运行在 8000 端口，避免与 macOS AirPlay 冲突
    app.run(debug=True, port=8000) 