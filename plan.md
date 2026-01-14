# LaTeX 수식 비교 프로토타입 - TDD 구현 계획

## 프로젝트 목표
Pyodide + SymPy를 활용하여 LaTeX 수식의 수학적 동등성 비교가 가능함을 증명하는 데모 앱

---

## 테스트 목록 (순차 진행)

### Phase 1: 기본 인프라
- [x] **T01**: Pyodide 로딩 및 SymPy 패키지 설치 확인 ✅
- [x] **T02**: `parse_latex` 함수로 간단한 LaTeX 파싱 확인 ✅ (커스텀 `latex_to_sympy` 사용)

### Phase 2: 기본 대수식 비교
- [x] **T03**: `x+1`과 `1+x` 동등성 비교 → true ✅
- [ ] **T04**: `2x`와 `x+x` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T05**: `x/1`과 `x` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T06**: `x+1`과 `x+2` 비동등성 비교 → false (직접 테스트 필요)

### Phase 3: 다항식 및 분수
- [ ] **T07**: `(x+1)^2`과 `x^2+2x+1` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T08**: `\frac{x^2-1}{x-1}`과 `x+1` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T09**: `\frac{1}{x} + \frac{1}{y}`와 `\frac{x+y}{xy}` 동등성 비교 → true (직접 테스트 필요)

### Phase 4: 삼각함수
- [x] **T10**: `\sin^2(x) + \cos^2(x)`와 `1` 동등성 비교 → true ✅
- [ ] **T11**: `\tan(x)`와 `\frac{\sin(x)}{\cos(x)}` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T12**: `\sin(2x)`와 `2\sin(x)\cos(x)` 동등성 비교 → true (직접 테스트 필요)

### Phase 5: 지수/로그
- [x] **T13**: `e^{i\pi} + 1`과 `0` 동등성 비교 → true ✅ (오일러 공식)
- [ ] **T14**: `\ln(e^x)`와 `x` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T15**: `e^{\ln(x)}`와 `x` 동등성 비교 → true (직접 테스트 필요)

### Phase 6: 미분
- [ ] **T16**: `\frac{d}{dx}(x^2)`와 `2x` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T17**: `\frac{d}{dx}(\sin(x))`와 `\cos(x)` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T18**: `\frac{d}{dx}(e^x)`와 `e^x` 동등성 비교 → true (직접 테스트 필요)

### Phase 7: 적분
- [ ] **T19**: `\int x \, dx`와 `\frac{x^2}{2}` 동등성 비교 → true (부정적분, 상수 차이 가능)
- [ ] **T20**: `\int \cos(x) \, dx`와 `\sin(x)` 동등성 비교 → true (부정적분, 상수 차이 가능)
- [ ] **T21**: `\int_0^1 x \, dx`와 `\frac{1}{2}` 동등성 비교 → true (직접 테스트 필요)

### Phase 8: 극한
- [ ] **T22**: `\lim_{x \to 0} \frac{\sin(x)}{x}`와 `1` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T23**: `\lim_{x \to \infty} \frac{1}{x}`와 `0` 동등성 비교 → true (직접 테스트 필요)
- [ ] **T24**: `\lim_{n \to \infty} (1 + \frac{1}{n})^n`와 `e` 동등성 비교 → true (복잡한 케이스)

### Phase 9: UI 컴포넌트
- [x] **T25**: MathInput 컴포넌트 렌더링 및 LaTeX 값 출력 ✅
- [x] **T26**: 비교 버튼 클릭 시 결과 표시 ✅
- [x] **T27**: Pyodide 로딩 중 오버레이 표시 ✅
- [x] **T28**: 테스트 케이스 선택 시 입력 필드 자동 채움 ✅

### Phase 10: Fallback (MathLive Compute Engine)
- [ ] **T29**: SymPy 파싱 실패 시 Compute Engine fallback 동작 확인 (미구현)
- [ ] **T30**: Fallback 사용 시 결과에 표시 (미구현)

---

## 기술 스택
- Next.js 16 + React 19
- MathLive (LaTeX 입력 UI)
- Pyodide + SymPy (수식 비교 엔진)
- MathLive Compute Engine (Fallback)
- Tailwind CSS (스타일링)
- Web Worker (Pyodide 실행)
