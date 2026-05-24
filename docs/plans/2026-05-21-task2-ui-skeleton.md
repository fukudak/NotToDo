# NotToDo Task 2 日誌

## 取り組んだこと
- Task 2 として MVP の画面骨組みを追加
- リスト / 振り返り / 編集 / 設定 の 4 タブを用意
- 編集・設定はプレースホルダー画面を追加
- 画面遷移のテストを追加して確認

## 変更したもの
- `client/src/App.tsx`
- `client/_tests/AppSkeleton.test.tsx`

## 確認
- `vitest run client/_tests/App.test.tsx client/_tests/AppSkeleton.test.tsx --reporter verbose`
- `vitest run --reporter dot`
- 結果: 6 files passed, 39 tests passed

## メモ
- まだデータがなくても起動できる骨組みはできた
- 次は Task 3 のユーザー切り替えへ進む
