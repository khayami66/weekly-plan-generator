# 週案くん 最適化実施タイムライン

## 📅 最適化実施計画

### Phase 1: 即座実施（開発停滞時・バグ修正時）
**実施タイミング**: 新機能開発の合間、バグ修正時
**所要時間**: 1-2時間
**リスク**: 極低

#### 1.1 型安全性向上
- [ ] `SettingsSummary.tsx:132` の `as any` を適切な型に修正
- [ ] `database.types.ts` に `daily_periods` カラム定義追加
- [ ] 共通インターフェース（User, Subject, Publisher）を `types/common.ts` に統一

```typescript
// types/common.ts 作成例
export interface User {
  id: string
  email: string
  role: 'homeroom' | 'specialist'
  grade?: number
  class_number?: number
}
```

#### 1.2 不要なuseMemo削除
- [ ] `WeeklyPlanGenerator.tsx:84` のperiods配列条件分岐削除
- [ ] `SettingsSummary.tsx:61` のsupabaseクライアントuseMemo削除

### Phase 2: 機能追加時実施（新機能開発時）
**実施タイミング**: 新しいページ・コンポーネント追加時
**所要時間**: 2-4時間
**リスク**: 低

#### 2.1 エラーハンドリング統一
- [ ] 全`console.error` + `alert`を`toast.error`に統一
- [ ] エラーメッセージの日本語化と詳細化
- [ ] `AuthTest.tsx:48` のError型チェック改善

#### 2.2 コンポーネント分割
- [ ] `WeeklyPlanGenerator.tsx` (469行) を以下に分割：
  - `WeekPlanHeader.tsx` (週選択・操作ボタン)
  - `WeekPlanGrid.tsx` (時間割グリッド)
  - `WeekPlanCell.tsx` (各セル)

### Phase 3: パフォーマンス問題発生時実施
**実施タイミング**: ユーザー数増加時、読み込み速度低下時
**所要時間**: 4-8時間
**リスク**: 中

#### 3.1 データベースクエリ最適化
- [ ] `WeeklyPlanGenerator.tsx:91-104` のN+1問題解決
```typescript
// 現在: ループでクエリ実行
for (const userSubject of userSubjects) {
  const { data: units } = await supabase.from('textbook_units')...
}

// 最適化: 一括取得
const subjectIds = userSubjects.map(us => us.subject_id)
const { data: allUnits } = await supabase
  .from('textbook_units')
  .select('*')
  .in('subject_id', subjectIds)
```

- [ ] `SetupWizardFixed.tsx:246-250` の順次処理を並列化
- [ ] `SettingsSummary.tsx` の複雑なJOINクエリ最適化

#### 3.2 バンドルサイズ最適化
- [ ] webpack-bundle-analyzer導入とサイズ分析
- [ ] docx/exceljs動的インポート化
- [ ] lucide-reactアイコン個別インポート確認

### Phase 4: スケール時実施（ユーザー数100+時）
**実施タイミング**: 本格運用開始時、パフォーマンス限界到達時
**所要時間**: 1-2週間
**リスク**: 高

#### 4.1 State管理最適化
- [ ] Zustand導入による状態管理改善
- [ ] React Query導入によるキャッシュ戦略実装
- [ ] Suspense境界による読み込み体験向上

#### 4.2 データベース最適化
- [ ] テーブルインデックス最適化
- [ ] クエリパフォーマンス分析
- [ ] データベース正規化見直し

## 🎯 最適化実施の判断基準

### 即座実施の判断基準
- [ ] 型エラーが頻発している
- [ ] コンソールにワーニングが多数表示
- [ ] 開発効率が低下している

### 機能追加時実施の判断基準
- [ ] 新しいページ/コンポーネントを追加する
- [ ] エラーハンドリングが必要な機能を追加
- [ ] コードの複雑性が増している

### パフォーマンス問題時実施の判断基準
- [ ] 初期ロード時間が3秒以上
- [ ] 週案生成に10秒以上かかる
- [ ] ユーザーから速度に関する苦情
- [ ] メモリ使用量が異常に高い

### スケール時実施の判断基準
- [ ] 同時ユーザー数100人以上
- [ ] データベースクエリが頻繁にタイムアウト
- [ ] サーバーリソース使用率80%以上
- [ ] 新機能追加が困難になっている

## 📋 最適化チェックリスト

### 実施前チェック
- [ ] 現在のパフォーマンス測定値記録
- [ ] バックアップ作成
- [ ] テスト環境での動作確認
- [ ] 影響範囲の明確化

### 実施後チェック
- [ ] パフォーマンス改善値測定
- [ ] 全機能の動作確認
- [ ] エラーログ確認
- [ ] ユーザビリティテスト

## 🛠 必要ツール・ライブラリ

### Phase 1-2 （基本最適化）
```bash
# 型チェック強化
npm install --save-dev @typescript-eslint/eslint-plugin

# パフォーマンス測定
npm install --save-dev @next/bundle-analyzer
```

### Phase 3-4 （高度最適化）
```bash
# State管理
npm install zustand

# データフェッチング最適化
npm install @tanstack/react-query

# パフォーマンス分析
npm install --save-dev webpack-bundle-analyzer
```

## 📞 緊急時対応

### 重大なパフォーマンス問題発生時
1. **即座対応**: Phase 3.1のデータベースクエリ最適化を優先実施
2. **一時対応**: ローディング表示追加でUX改善
3. **根本対応**: Phase 4の本格的最適化計画立案

### 型エラー頻発時
1. **即座対応**: Phase 1.1の型安全性向上を即日実施
2. **予防対応**: ESLint設定強化で今後の型エラー防止

---

**最終更新**: 2025-09-20
**次回見直し**: 新機能追加時、パフォーマンス問題発生時