# 週案自動生成システム セットアップガイド

## Supabaseプロジェクト設定

### 1. Supabaseアカウント作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. Googleアカウントでサインアップ

### 2. 新しいプロジェクト作成
1. 「New project」をクリック
2. プロジェクト情報を入力：
   - **Name**: `weekly-plan-generator`
   - **Database Password**: 強力なパスワードを設定（保存しておく）
   - **Region**: `Asia Pacific (Tokyo)`
3. 「Create new project」をクリック（数分かかります）

### 3. データベーススキーマの適用
1. プロジェクト作成完了後、左サイドバーの「SQL Editor」をクリック
2. 新しいクエリを開く
3. `database/schema.sql` の内容を全てコピーして貼り付け
4. 「RUN」ボタンをクリック
5. `database/home_economics_units.sql` の内容も同様に実行

### 4. Google OAuth設定

#### Google Cloud Console設定
1. https://console.cloud.google.com にアクセス
2. 新しいプロジェクトを作成：
   - プロジェクト名: `weekly-plan-generator`
3. 「APIs & Services」→「OAuth consent screen」に移動
   - User Type: External
   - App name: `週案くん`
   - User support email: あなたのメールアドレス
   - Developer contact: あなたのメールアドレス
4. 「APIs & Services」→「Credentials」に移動
5. 「+ CREATE CREDENTIALS」→「OAuth 2.0 Client IDs」
6. Application type: `Web application`
7. Name: `weekly-plan-generator`
8. Authorized redirect URIs: `https://[your-supabase-project-id].supabase.co/auth/v1/callback`
   - ⚠️ [your-supabase-project-id]は実際のSupabaseプロジェクトIDに置き換える
9. 「CREATE」をクリック
10. Client IDとClient Secretをコピーして保存

#### Supabase認証設定
1. Supabaseダッシュボードの「Authentication」→「Providers」に移動
2. 「Google」をクリック
3. 「Enable sign in with Google」をONにする
4. Google Cloud Consoleで取得したClient IDとClient Secretを入力
5. 「Save」をクリック

### 5. プロジェクト情報取得
1. Supabaseダッシュボードの「Settings」→「API」に移動
2. 以下の情報をコピー：
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon public key**: `eyJ...`（長い文字列）

### 6. 環境変数設定
1. プロジェクトルートの `.env.local` ファイルを編集
2. 以下のように設定：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...[your-anon-key]

# Google OAuth Configuration  
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
```

### 7. 動作確認
1. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```
2. http://localhost:3000 にアクセス
3. 「Googleでログイン」をクリックして動作確認

## トラブルシューティング

### よくあるエラー
1. **認証エラー**: Google OAuth設定のリダイレクトURIを確認
2. **データベースエラー**: スキーマが正しく適用されているか確認
3. **環境変数エラー**: `.env.local` の設定を確認

### 確認事項
- [ ] Supabaseプロジェクトが作成されている
- [ ] データベーススキーマが適用されている
- [ ] Google OAuthが設定されている
- [ ] 環境変数が正しく設定されている
- [ ] 開発サーバーが起動している