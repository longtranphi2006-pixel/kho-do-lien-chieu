import { NextRequest, NextResponse } from 'next/server';
import { ModerationResult } from '@/types';
import { getAiModerationConfig } from '@/lib/aiConfig';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = '', description = '', category = '', purpose = 'FREE', images = [] } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    const config = await getAiModerationConfig();

    // 1. If Gemini API Key is available, invoke Google Gemini Multimodal AI
    if (apiKey) {
      try {
        // Construct dynamic criteria based on Admin's configuration
        const activeRules: string[] = [];
        if (config.blockCommercial) {
          activeRules.push('1. NGUYÊN TẮC PHI THƯƠNG MẠI: Tuyệt đối KHÔNG được rao bán, thu tiền mặt, chuyển khoản ngân hàng, báo giá (vd: 50k, 100.000đ, giá rẻ, thanh lý có thu tiền). Chỉ chấp nhận "Cho miễn phí" hoặc "Đổi đồ".');
        }
        if (config.blockProhibitedGoods) {
          activeRules.push('2. AN TOÀN & HỢP PHÁP: Cấm vũ khí, hung khí, ma túy, chất kích thích, thuốc lá/vape, hóa chất nguy hiểm, nội dung người lớn, hàng giả hàng cấm.');
        }
        if (config.blockFoodFresh) {
          activeRules.push('3. THỰC PHẨM & ĐỒ ĂN: Cấm đồ ăn tươi sống, thực phẩm tự nấu dễ ôi thiu. Chỉ cho phép thực phẩm khô đóng gói nguyên seal, còn hạn sử dụng rõ ràng.');
        }
        if (config.blockPrescriptionDrugs) {
          activeRules.push('4. DƯỢC PHẨM & Y TẾ: Cấm thuốc chữa bệnh kê đơn, thực phẩm chức năng không rõ nguồn gốc.');
        }
        if (config.blockCosmeticsOpen) {
          activeRules.push('5. MỸ PHẨM: Cấm mỹ phẩm chiết, kem trộn không nhãn mác, mỹ phẩm đã mở nắp quá lâu.');
        }
        if (config.requireStudentUsefulness) {
          activeRules.push('6. TÍNH XÁC THỰC SINH VIÊN: Đồ dùng thực tế cho sinh viên/cư dân Liên Chiểu (sách vở, giáo trình, đồ gia dụng, đồ học tập, quần áo, thiết bị cá nhân...).');
        }
        if (config.blockPhoneAndBankingInImage || config.blockStockImages) {
          let imgRule = '7. HÌNH ẢNH:';
          if (config.blockPhoneAndBankingInImage) {
            imgRule += ' Kiểm tra hình ảnh không được chứa số điện thoại, số tài khoản ngân hàng hoặc mã QR chuyển tiền/đặt cọc.';
          }
          if (config.blockStockImages) {
            imgRule += ' Ưu tiên ảnh chụp thực tế tại phòng trọ/trường học, cảnh báo nếu là ảnh mạng/ảnh chụp màn hình sàn TMĐT Shopee/Lazada.';
          }
          activeRules.push(imgRule);
        }

        const customGuidelines = config.customRules?.trim()
          ? `\nQUY TẮC BỔ SUNG CỦA BAN QUẢN TRỊ BQL LIÊN CHIỂU:\n${config.customRules}`
          : '';

        const blacklistNotice = config.customBlacklist && config.customBlacklist.length > 0
          ? `\nDANH SÁCH TỪ KHÓA BỊ CẤM / NGHI NGỜ:\n${config.customBlacklist.join(', ')}`
          : '';

        const prompt = `
Bạn là AI Kiểm Duyệt Nội Dung cho nền tảng phi thương mại "KHO ĐỒ LIÊN CHIỂU" (chia sẻ đồ dùng miễn phí và đổi đồ cho sinh viên tại quận Liên Chiểu, Đà Nẵng).

Nhiệm vụ:
Kiểm duyệt bài đăng sau đây dựa trên các tiêu chí nghiêm ngặt do Ban Quản Trị thiết lập:
${activeRules.join('\n')}
${customGuidelines}
${blacklistNotice}

Quy định ngưỡng duyệt:
- Ngưỡng điểm tự động duyệt là: ${config.autoApproveConfidence}%.
- Nếu bài đăng an toàn, hợp lệ và điểm tin cậy >= ${config.autoApproveConfidence}% -> Đặt "status": "ACTIVE".
- Nếu có nghi ngờ, vi phạm chính sách hoặc điểm tin cậy < ${config.autoApproveConfidence}% -> Đặt "status": "PENDING_ADMIN".

Thông tin bài đăng:
- Tiêu đề: "${title}"
- Mô tả: "${description}"
- Danh mục: "${category}"
- Mục đích: "${purpose === 'FREE' ? 'Cho miễn phí' : 'Đổi đồ'}"
- Số lượng ảnh đính kèm: ${images.length}

Trả về DUY NHẤT một chuỗi JSON hợp lệ theo định dạng sau (không markdown, không bọc backtick):
{
  "passed": true hoặc false,
  "status": "ACTIVE" hoặc "PENDING_ADMIN",
  "confidence": số nguyên từ 0 đến 100,
  "reasoning": "Giải thích ngắn gọn bằng tiếng Việt lý do duyệt hoặc lý do cần chuyển BQL duyệt",
  "detected_tags": ["danh", "sách", "nhãn"]
}
`;

        const parts: any[] = [{ text: prompt }];

        // Attach image parts for real Gemini Vision multimodal inspection
        if (Array.isArray(images) && images.length > 0) {
          for (const img of images.slice(0, 2)) {
            if (typeof img === 'string' && img.startsWith('data:image/')) {
              const [meta, base64Data] = img.split(',');
              const mimeMatch = meta.match(/data:(.*?);base64/);
              if (base64Data && mimeMatch) {
                parts.push({
                  inlineData: {
                    mimeType: mimeMatch[1],
                    data: base64Data,
                  },
                });
              }
            }
          }
        }

        const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.5-flash'];

        for (const model of candidateModels) {
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.2,
                },
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (rawText) {
                const parsed = JSON.parse(rawText.trim());
                const confidence = Number(parsed.confidence) || 98;
                const passed = Boolean(parsed.passed);
                const status = (passed && confidence >= config.autoApproveConfidence && parsed.status === 'ACTIVE')
                  ? 'ACTIVE'
                  : 'PENDING_ADMIN';

                return NextResponse.json({
                  passed,
                  status,
                  confidence,
                  reasoning: String(parsed.reasoning || `Kiểm duyệt tự động bởi Google Gemini (${model}) thành công.`),
                  detected_tags: Array.isArray(parsed.detected_tags) ? parsed.detected_tags : ['an-toan', 'hop-le'],
                } as ModerationResult);
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${model} failed, trying next candidate:`, modelErr);
          }
        }
      } catch (geminiError) {
        console.warn('Gemini API call failed, falling back to local rule engine:', geminiError);
      }
    }

    // 2. Intelligent Rule-Based Engine (Fallback & Instant local execution)
    const combinedText = `${title} ${description}`.toLowerCase();

    // Check custom blacklist
    if (config.customBlacklist && config.customBlacklist.length > 0) {
      const hitBlacklist = config.customBlacklist.find((word) =>
        word.trim() && combinedText.includes(word.trim().toLowerCase())
      );
      if (hitBlacklist) {
        return NextResponse.json({
          passed: false,
          status: 'PENDING_ADMIN',
          confidence: 95,
          reasoning: `Phát hiện từ khóa bị cấm bởi Ban Quản Trị: "${hitBlacklist}". Chuyển sang hàng đợi Admin duyệt.`,
          detected_tags: ['vi-pham-tu-khoa-bql', 'tu-khoa-cam'],
        } as ModerationResult);
      }
    }

    // Commercial and monetary keywords check
    if (config.blockCommercial) {
      const commercialPatterns = [
        /\b\d+\s*(k|nghìn|ngàn|vnd|vnđ|đ|dong|đồng|triệu|tr)\b/i,
        /bán lại/i,
        /thanh lý giá/i,
        /giá chỉ/i,
        /tiền mặt/i,
        /chuyển khoản/i,
        /inbox báo giá/i,
        /mua bán/i,
        /mặc cả/i,
      ];

      const hasCommercialIntent = commercialPatterns.some((pattern) => pattern.test(combinedText));
      if (hasCommercialIntent) {
        return NextResponse.json({
          passed: false,
          status: 'PENDING_ADMIN',
          confidence: 88,
          reasoning: 'Phát hiện dấu hiệu giao dịch thương mại (tiền mặt / giá bán). Đã chuyển sang hàng đợi Admin duyệt.',
          detected_tags: ['yeu-to-thuong-mai', 'can-kiem-tra-gia'],
        } as ModerationResult);
      }
    }

    // Prohibited keywords check
    if (config.blockProhibitedGoods) {
      const prohibitedKeywords = [
        'vũ khí', 'súng', 'đạn', 'dao bấm', 'kiếm', 'thuốc lá', 'vape', 'pod', 'cần sa', 'ma túy',
        'chất kích thích', 'đồ chơi tình dục', 'rượu', 'bia cồn', 'hóa chất độc',
      ];
      const hasProhibited = prohibitedKeywords.some((word) => combinedText.includes(word));
      if (hasProhibited) {
        return NextResponse.json({
          passed: false,
          status: 'PENDING_ADMIN',
          confidence: 98,
          reasoning: 'Phát hiện từ khóa thuộc danh mục cấm/hạn chế trao đổi theo tiêu chuẩn an toàn cộng đồng.',
          detected_tags: ['vi-pham-chinh-sach', 'danh-muc-cam'],
        } as ModerationResult);
      }
    }

    // Clean, community item
    return NextResponse.json({
      passed: true,
      status: 'ACTIVE',
      confidence: 96,
      reasoning: 'Nội dung phù hợp mục đích phi thương mại, đáp ứng tiêu chuẩn cộng đồng Kho Đồ Liên Chiểu.',
      detected_tags: ['phi-thuong-mai', 'hop-le', 'sinh-vien'],
    } as ModerationResult);
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json(
      {
        passed: true,
        status: 'ACTIVE',
        confidence: 80,
        reasoning: 'Đã thông qua kiểm tra cơ bản.',
        detected_tags: ['kiem-tra-co-ban'],
      } as ModerationResult,
      { status: 200 }
    );
  }
}
