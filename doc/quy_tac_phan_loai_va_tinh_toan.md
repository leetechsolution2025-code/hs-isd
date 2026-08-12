# Quy Tắc Phân Loại Mặt Cắt Ngang và Tính Toán Khối Lượng Kênh

Tài liệu này định nghĩa các quy tắc hình học dùng để phân loại mặt cắt ngang kênh mương (đào, đắp, bán đào bán đắp) và phương pháp tính toán khối lượng tương ứng (diện tích đào, diện tích đắp, diện tích bóc thảo mộc, và chiều dài trồng cỏ bảo vệ mái bờ).

Mục tiêu là đồng bộ hóa thuật toán hiển thị đồ họa trực quan (**Frontend** tại `TerrainCrossSectionView.tsx`) và thuật toán xuất số liệu báo cáo/bản vẽ DXF (**Backend** tại `crossSectionGeometry.ts`).

---

## 1. Các Điểm Đặc Trưng Trên Mặt Cắt Ngang

Để phân loại mặt cắt ngang, thuật toán căn cứ vào vị trí các điểm đặc trưng sau:
*   **Mép ngoài bờ trái thiết kế (`bankOuterLeft` - Điểm 3):** Vị trí kết thúc của phần bờ đỉnh bên trái.
*   **Mép ngoài bờ phải thiết kế (`bankOuterRight` - Điểm 4):** Vị trí kết thúc của phần bờ đỉnh bên phải.
*   **Cao độ thiết kế bờ trái (`bankElevLeft`) và bờ phải (`bankElevRight`).**
*   **Cao độ địa hình tự nhiên (`getTerrainElev(x)`)** tại các khoảng cách tương ứng từ tâm kênh.
*   **Điểm khống chế kiểm tra mái đào dốc ra ngoài:**
    *   Phía trái: `test_bank_x_l = Math.min(bankOuterLeft.x, x_trench_left_top)`
    *   Phía phải: `test_bank_x_r = Math.max(bankOuterRight.x, x_trench_right_top)`

---

## 2. Phân Loại Mặt Cắt Kênh

Mặt cắt kênh được phân loại dựa trên mối quan hệ giữa cao độ địa hình tự nhiên và cao độ đỉnh bờ thiết kế:

### 2.1. Xác định Trạng thái Đào/Đắp của Từng Bên Bờ
Mỗi bên bờ (Trái/Phải) được phân loại độc lập là **Đào (Cut)** hoặc **Đắp (Fill)**:

*   **Bờ Trái là bờ Đào (`isLeftCut = true`)** khi địa hình tự nhiên tại điểm kiểm tra cao hơn cao độ đỉnh bờ trái thiết kế:
    $$\text{getTerrainElev}(\text{test\_bank\_x\_l}) > \text{bankElevLeft}$$
    *Ngược lại, nếu thấp hơn hoặc bằng, bờ trái là bờ Đắp (`isLeftCut = false`).*

*   **Bờ Phải là bờ Đào (`isRightCut = true`)** khi địa hình tự nhiên tại điểm kiểm tra cao hơn cao độ đỉnh bờ phải thiết kế:
    $$\text{getTerrainElev}(\text{test\_bank\_x\_r}) > \text{bankElevRight}$$
    *Ngược lại, nếu thấp hơn hoặc bằng, bờ phải là bờ Đắp (`isRightCut = false`).*

### 2.2. Phân Loại Tổng Thể Mặt Cắt Ngang
Dựa trên trạng thái đào/đắp của hai bên bờ, mặt cắt ngang tổng thể được chia làm 3 loại chính:
1.  **Mặt cắt Đào hoàn toàn (Pure Cut):** Cả hai bên bờ đều ở trạng thái đào.
    $$\text{isLeftCut} == \text{true} \quad \text{và} \quad \text{isRightCut} == \text{true}$$
2.  **Mặt cắt Đắp hoàn toàn (Pure Fill / Full Fill):** Đáy móng kênh cao hơn hoặc xấp xỉ địa hình tự nhiên, không có đào móng sâu, hai bờ đều đắp dốc xuống đất tự nhiên.
3.  **Mặt cắt Nửa đào, nửa đắp (Bán đào bán đắp / Half Cut - Half Fill):** Một bên bờ là bờ đào và bên còn lại là bờ đắp. Hoặc lòng kênh đào sâu dưới địa hình nhưng hai bên bờ đắp cao hơn địa hình tự nhiên xung quanh (Ví dụ: Cọc 66).

---

## 3. Quy Tắc Tính Toán Khối Lượng và Vẽ Hình

Khi một bờ được xác định ở trạng thái **Đào (Cut)**, các khối lượng liên quan đến phần đắp và bảo vệ mái bờ đắp của bờ đó phải được triệt tiêu về $0$.

### 3.1. Diện Tích Đất Đắp ($S_{đắp}$)
*   **Bờ Trái Đào (`isLeftCut = true`):**
    *   Không vẽ vùng màu vàng đắp bờ trái.
    *   Đa giác đắp bờ trái (`leftEmbankmentPoly`) được đặt là rỗng $\rightarrow$ Diện tích đắp bờ trái đóng góp vào $S_{đắp}$ bằng $0$.
*   **Bờ Phải Đào (`isRightCut = true`):**
    *   Không vẽ vùng màu vàng đắp bờ phải.
    *   Đa giác đắp bờ phải (`rightEmbankmentPoly`) được đặt là rỗng $\rightarrow$ Diện tích đắp bờ phải đóng góp vào $S_{đắp}$ bằng $0$.
*   *Lưu ý:* Phần đất đắp hoàn trả (nếu có) sau khi thi công móng kênh nằm phía dưới cao độ đỉnh bờ và sát tường kênh không tính vào diện tích đắp bờ nổi này.

### 3.2. Diện Tích Bóc Thảo Mộc ($S_{bóc\_TM}$)
Bóc thảo mộc chỉ thực hiện trên bề mặt đất tự nhiên chuẩn bị đắp đê/bờ kênh để đảm bảo độ liên kết. Do đó:
*   Nếu bờ trái đào (`isLeftCut = true`): Không tính bóc thảo mộc bờ trái $\rightarrow$ Diện tích bóc thảo mộc đóng góp của bờ trái bằng $0$ (`leftStrippedPoly` rỗng).
*   Nếu bờ phải đào (`isRightCut = true`): Không tính bóc thảo mộc bờ phải $\rightarrow$ Diện tích bóc thảo mộc đóng góp của bờ phải bằng $0$ (`rightStrippedPoly` rỗng).

### 3.3. Chiều Dài Trồng Cỏ Bảo Vệ Mái Bờ ($L_{trồng\_cỏ}$)
*   Chỉ tính trồng cỏ khi mặt cắt có tùy chọn trồng cỏ (`params.coTrongCo == true`).
*   Công thức tổng quát:
    $$L_{trồng\_cỏ} = L_{35} + L_{46}$$
    *   $L_{35}$ là chiều dài mái dốc đắp bờ trái (từ điểm 3 đến điểm 5).
    *   $L_{46}$ là chiều dài mái dốc đắp bờ phải (từ điểm 4 đến điểm 6).
*   **Quy tắc loại trừ:**
    *   Nếu bờ trái đào (`isLeftCut = true`), mái dốc ngoài là mái đào đi lên đồi chứ không phải mái đắp đi xuống đất $\rightarrow$ **$L_{35} = 0$**.
    *   Nếu bờ phải đào (`isRightCut = true`), mái dốc ngoài là mái đào đi lên đồi $\rightarrow$ **$L_{46} = 0$**.

---

## 4. Minh Họa Trường Hợp Điển Hình

### 4.1. Cọc 54 (Mặt cắt Đào hoàn toàn)
*   **Địa hình:** Đất tự nhiên hai bên cao hơn đỉnh bờ kênh.
*   **Trạng thái:** `isLeftCut = true` và `isRightCut = true`.
*   **Kết quả tính toán:**
    *   $S_{đắp} = 0\text{ m}^2$
    *   $S_{bóc\_TM} = 0\text{ m}^2$
    *   $L_{trồng\_cỏ} = 0\text{ m}$
    *   Hình vẽ chỉ thể hiện mái đào đi lên địa hình tự nhiên, không có màu vàng đất đắp.

### 4.2. Cọc 66 (Mặt cắt Nửa đào, nửa đắp)
*   **Địa hình:** Đất tự nhiên bên trái thấp (cần đắp bờ trái), đất tự nhiên bên phải cao dốc lên (cần đào mái phải).
*   **Trạng thái:** `isLeftCut = false` (Bờ trái đắp) và `isRightCut = true` (Bờ phải đào).
*   **Kết quả tính toán:**
    *   $S_{đắp}$ = Diện tích đắp bờ trái ($S_{đắp\_trái} > 0$, $S_{đắp\_phải} = 0$).
    *   $S_{bóc\_TM}$ = Diện tích bóc thảo mộc bờ trái ($S_{bóc\_TM\_trái} > 0$, $S_{bóc\_TM\_phải} = 0$).
    *   $L_{trồng\_cỏ} = L_{35}$ (Chỉ tính trồng cỏ mái dốc ngoài bờ trái, mái phải đào không tính).
    *   Hình vẽ chỉ tô màu vàng đắp bờ ở bên trái.
