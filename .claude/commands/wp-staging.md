# WordPressステージング環境構築

ローカル環境からステージング環境を構築・反映する手順。

## 前提

- サーバー: さくらインターネット（他サーバーの場合は手順が一部異なる）
- 移行ツール: All-in-One WP Migration プラグイン

## 手順

### 1. サブドメイン作成（さくらコントロールパネル）

```
さくらのコントロールパネル
→ ドメイン設定
→ 「サブドメインの追加」
→ stg.（ドメイン名） を作成
```

### 2. サブドメインにWordPressインストール

```
クイックインストール → WordPress
→ インストール先: stg.（ドメイン名）
→ DB名・ユーザー名・パスワードを記録しておく
```

### 3. Basic認証の設定

`.htaccess` と `.htpasswd` をサブドメインのルートに設置する。

**.htaccess に追記**
```apache
AuthType Basic
AuthName "Staging"
AuthUserFile /（サーバーの絶対パス）/.htpasswd
Require valid-user
```

**.htpasswd（パスワードはhtpasswdコマンドで生成）**
```
username:（暗号化されたパスワード）
```

### 4. ローカルからエクスポート

```
WordPressダッシュボード
→ All-in-One WP Migration
→ エクスポート → ファイル
→ .wpress ファイルをダウンロード
```

### 5. ステージングにインポート

```
ステージングのWordPressダッシュボード
→ All-in-One WP Migration
→ インポート → ファイルをアップロード
→ URLの書き換えは自動で行われる
```

### 6. クライアントへの共有

```
URL: https://stg.（ドメイン名）
Basic認証 ID: （設定したID）
Basic認証 PW: （設定したPW）
WP管理画面: https://stg.（ドメイン名）/wp-admin
```

## ステージング → 本番への反映

修正完了後、同じ手順で本番サーバーにインポートする。

```
ステージングからエクスポート
→ 本番WordPressにインポート
→ 動作確認
→ Basic認証を解除
```

## 注意事項

- `uploads` フォルダの画像はエクスポートに含まれるが、容量が大きい場合は分割エクスポートが必要
- All-in-One WP Migrationの無料版はインポート上限512MB（大規模サイトは有料版を検討）
- 本番反映後は必ずキャッシュをクリアする
