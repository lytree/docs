---

title: linq2db 实现自定义数据库
date: 2026-08-17 10:00:00
lastmod: 2026-08-17 10:00:00
category: linq2db

---
# linq2db 实现自定义数据库 — 开发文档

## 1. 架构总览

linq2db 5.x 的 Provider 由四个核心组件构成，自上而下：

```
┌──────────────────────────────────────────┐
│  DataProviderBase   ← 入口 / 元数据声明   │  必实现
├──────────────────────────────────────────┤
│  BasicSqlBuilder    ← SQL 文本生成        │  通过 CreateSqlBuilder 返回
│  BasicSqlOptimizer  ← LINQ → SQL 重写     │  通过 GetSqlOptimizer 返回
├──────────────────────────────────────────┤
│  SchemaProviderBase ← 表/列元数据探测      │  通过 GetSchemaProvider 返回
├──────────────────────────────────────────┤
│  MappingSchema      ← CLR ↔ DB 类型映射    │  构造时传入
├──────────────────────────────────────────┤
│  DbConnection / DbCommand / DbDataReader │  必实现 — 与底层存储通信
└──────────────────────────────────────────┘
```

> **关键事实**：5.x 把 `BuildSelect` / `BuildInsert` 等 SQL 构造方法标成 `internal`，所以生成完整自定义 SQL 语法需要 fork 框架。公开 API 范围内能做到的 SQL 定制有两类：① 调整 `SqlProviderFlags`（声明式）；② 继承 `BasicSqlOptimizer` 重写 `ConvertXxx` / `OptimizeXxx`（过程式）。

---

## 2. 必须实现 vs 可选实现

### 2.1 `DataProviderBase` 抽象成员（必须 override）

| 成员 | 类型 | 作用 |
|------|------|------|
| `ConnectionNamespace` | `string` | 自定义类型命名空间隔离 |
| `DataReaderType` | `Type` | 底层 reader 类型（通常 `typeof(DbDataReader)`） |
| `SupportedTableOptions` | `TableOptions` | 表选项支持标志 |
| `CreateConnectionInternal(string)` | `DbConnection` | 真实 DbConnection 工厂 |
| `CreateSqlBuilder(MappingSchema, DataOptions)` | `ISqlBuilder` | SQL 构造器 |
| `GetSqlOptimizer(DataOptions)` | `ISqlOptimizer` | 表达式优化器 |
| `GetSchemaProvider()` | `ISchemaProvider` | 元数据探测 |

### 2.2 sealed（**不能** override）

| 成员 | 设置方式 |
|------|----------|
| `Name` | 构造函数传入 |
| `ID` | 框架内部分配 |
| `SqlProviderFlags` | 通过 `CreateSqlBuilder` 传给 `BasicSqlBuilder` |

### 2.3 可选 override

`CreateConnection(string)`、`MappingSchema`、`TransactionsSupported`、`SetParameter`、`GetReaderExpression`、`IsDBNullAllowed`、`BulkCopy`、`BulkCopyAsync`、`ExecuteScope`、`InitContext`、`InitCommand`、`ClearCommandParameters`、`DisposeCommand`、`GetCommandBehavior`、`ConvertParameterType`、`SetParameterType`、`NormalizeTypeName`、`GetConnectionInfo`。

---

## 3. Provider 实现骨架

```csharp
using System.Data.Common;
using LinqToDB;
using LinqToDB.DataProvider;
using LinqToDB.Mapping;
using LinqToDB.SchemaProvider;
using LinqToDB.SqlProvider;

public sealed class CustomDbDataProvider : DataProviderBase
{
    public const string ProviderName = "CustomDB";

    // ctor 把 Name 和 MappingSchema 注入基类
    public CustomDbDataProvider()
        : base(ProviderName, CustomDbMappingSchema.Instance) { }

    // ===== 必须 override 的抽象成员 =====
    public override string       ConnectionNamespace    => ProviderName;
    public override Type         DataReaderType         => typeof(DbDataReader);
    public override TableOptions SupportedTableOptions => TableOptions.None;

    protected override DbConnection CreateConnectionInternal(string connectionString)
        => new CustomDbConnection(connectionString);

    protected override ISqlBuilder CreateSqlBuilder(MappingSchema mappingSchema, DataOptions dataOptions)
        => new BasicSqlBuilder(this, mappingSchema, dataOptions, GetSqlOptimizer(dataOptions), CustomDbSqlFlags.Build());

    protected override ISqlOptimizer GetSqlOptimizer(DataOptions dataOptions)
        => new BasicSqlOptimizer();

    protected override ISchemaProvider GetSchemaProvider()
        => new CustomDbSchemaProvider();
}
```

---

## 4. MappingSchema（类型映射）

构造参数必须等于 `DataProvider.Name`，否则框架找不到映射。

```csharp
public sealed class CustomDbMappingSchema : MappingSchema
{
    public static readonly CustomDbMappingSchema Instance = new();

    private CustomDbMappingSchema() : base(CustomDbDataProvider.ProviderName)
    {
        // 标量类型 → DB 类型（影响 CREATE TABLE 生成）
        AddScalarType(typeof(string),   new SqlDataType(DataType.NVarChar, "STRING"));
        AddScalarType(typeof(int),      new SqlDataType(DataType.Int32,    "INT32"));
        AddScalarType(typeof(long),     new SqlDataType(DataType.Int64,    "INT64"));
        AddScalarType(typeof(bool),     new SqlDataType(DataType.Boolean,  "BOOL"));
        AddScalarType(typeof(DateTime), new SqlDataType(DataType.DateTime, "DATETIME"));
        AddScalarType(typeof(decimal),  new SqlDataType(DataType.Decimal,  "DECIMAL(38,10)"));
        AddScalarType(typeof(double),   new SqlDataType(DataType.Double,   "FLOAT64"));
        AddScalarType(typeof(float),    new SqlDataType(DataType.Single,   "FLOAT32"));
        AddScalarType(typeof(byte[]),   new SqlDataType(DataType.Binary,   "BYTES"));

        // 值字面量转换：把 CLR 值翻译成 SQL 字面量
        SetValueToSqlConverter(typeof(Guid), (sb, _, v) =>
            sb.Append("'" + ((Guid)v!).ToString("D") + "'"));
    }
}
```

常用方法：
- `AddScalarType(Type, SqlDataType)` — 标量 → DB 类型
- `SetValueToSqlConverter(Type, Action<StringBuilder, MappingSchema, object?>)` — 字面量输出
- `SetScalarValueConverter(Type, ...)` — 读数据时的转换
- `SetDataType(Type, SqlDataType)` — 自定义类型列类型推断
- `AddMetadataReader(...)` — 自定义属性读取

---

## 5. SqlProviderFlags（声明式 SQL 能力）

`SqlProviderFlags` 是 `BasicSqlBuilder` 构造时的最后一个参数。框架根据这些布尔开关决定生成哪种 SQL 模式。

```csharp
internal static class CustomDbSqlFlags
{
    public static SqlProviderFlags Build() => new()
    {
        // 取行数
        IsTakeSupported                     = true,
        IsSkipSupported                     = true,
        IsSkipSupportedIfTake               = true,
        AcceptsTakeAsParameter              = false,
        AcceptsTakeAsParameterIfSkip        = false,
        TakeHintsSupported                  = null,

        // 子查询 / 聚合
        IsSubQueryTakeSupported             = true,
        IsSubQueryColumnSupported           = true,
        IsSubQueryOrderBySupported          = true,
        IsCountSubQuerySupported            = true,
        IsCountDistinctSupported            = true,

        // JOIN
        IsApplyJoinSupported                = false,   // 不支持 APPLY
        IsCrossJoinSupported                = true,
        IsInnerJoinAsCrossSupported         = false,

        // CTE / MERGE / UPDATE
        IsCommonTableExpressionsSupported   = true,
        IsInsertOrUpdateSupported           = false,   // 不支持 INSERT OR UPDATE
        IsUpdateFromSupported               = true,

        // ORDER / GROUP / DISTINCT
        IsDistinctOrderBySupported          = false,
        IsOrderByAggregateFunctionsSupported = false,
        IsAllSetOperationsSupported         = true,
        IsDistinctSetOperationsSupported    = true,
        IsGroupByColumnRequred              = true,

        // 参数
        IsParameterOrderDependent           = false,
        CanCombineParameters                = true,

        // 输出子句
        IsOutputInsertSupported             = false,
        IsOutputUpdateSupported             = false,
        IsOutputDeleteSupported             = false,

        // 其他
        IsIdentityParameterRequired         = false,
        IsNamingQueryBlockSupported         = true,
    };
}
```

完整属性列表：`IsSybaseBuggyGroupBy`、`IsParameterOrderDependent`、`AcceptsTakeAsParameter`、`AcceptsTakeAsParameterIfSkip`、`IsTakeSupported`、`IsSkipSupported`、`IsSkipSupportedIfTake`、`TakeHintsSupported`、`IsSubQueryTakeSupported`、`IsSubQueryColumnSupported`、`IsSubQueryOrderBySupported`、`IsCountSubQuerySupported`、`IsIdentityParameterRequired`、`IsApplyJoinSupported`、`IsInsertOrUpdateSupported`、`CanCombineParameters`、`MaxInListValuesCount`、`IsUpdateSetTableAliasSupported`、`OutputDeleteUseSpecialTable`、`OutputInsertUseSpecialTable`、`OutputUpdateUseSpecialTables`、`IsGroupByColumnRequred`、`IsCrossJoinSupported`、`IsInnerJoinAsCrossSupported`、`IsCommonTableExpressionsSupported`、`IsDistinctOrderBySupported`、`IsOrderByAggregateFunctionsSupported`、`IsAllSetOperationsSupported`、`IsDistinctSetOperationsSupported`、`IsCountDistinctSupported`、`AcceptsOuterExpressionInAggregate`、`IsUpdateFromSupported`、`IsNamingQueryBlockSupported`、`DefaultMultiQueryIsolationLevel`、`RowConstructorSupport`、`CustomFlags`、`DoesNotSupportCorrelatedSubquery`、`IsExistsPreferableForContains`、`IsProjectionBoolSupported`。

---

## 6. SqlOptimizer（过程式 LINQ → SQL 重写）

需要"我的数据库对某种 SQL 模式不支持但 `SqlProviderFlags` 表达不了"的场景，继承 `BasicSqlOptimizer`：

```csharp
internal sealed class CustomDbSqlOptimizer : BasicSqlOptimizer
{
    // 关键覆写点：
    //   public override ISqlExpression ConvertCountSubQuery(SqlSelectStatement selectStatement);
    //   public override ISqlExpression OptimizeExpression(SqlStatement statement, ISqlExpression expression, ConvertVisitor<...> visitor);
    //   public override SqlStatement TransformStatement(SqlStatement statement);
    //   public override SqlStatement FinalizeStatement(SqlStatement statement);
    //   public override bool CanCompareSearchConditions { get; }
    //   public override IQueryElement ConvertElement(IQueryElement element);
    //   public override ISqlPredicate ConvertPredicate(ISqlPredicate predicate);
    //   public override ISqlExpression ConvertExpressionImpl(ISqlExpression expression, ...);
    //   public override SqlPredicate ConvertBetweenPredicate(...);
    //   public override SqlPredicate ConvertLikePredicate(...);
    //   public override SqlPredicate ConvertInListPredicate(...);
    //   public override ISqlExpression ConvertSkipTake(...);
    //   public override bool IsParameterDependedElement(IQueryElement element);
    //   public override EscapeLikeCharacters(...)
}
```

5.x 没有 public `BasicSqlOptimizer()` 构造函数——参数化构造必须传 `SqlProviderFlags`。无参构造会在运行时被框架调用，所以需要添加一个 internal/protected 包装，或者实例化时手动传 flags。

---

## 7. SchemaProvider（元数据探测）

`SchemaProviderBase` 是 abstract，但没有 abstract 方法——所有方法都有默认实现，可以直接继承并最小覆写。

```csharp
public sealed class CustomDbSchemaProvider : SchemaProviderBase
{
    // 真实实现：调用后端的"列出所有表 / 列出所有列"接口
    // 默认实现返回空 → 用户必须用 [Table] / [Column] attribute 显式声明映射
}
```

> **实践建议**：除非提供 schema 探测能力，否则用户的实体必须打 `[Table]`、`[Column]`、`[PrimaryKey]`、`[Identity]`、`[Nullable]` 等 attribute，否则 linq2db 拿不到任何元数据。

---

## 8. DbConnection（与底层存储通信）

唯一必须 100% 自己写的层。骨架：

```csharp
public sealed class CustomDbConnection : DbConnection
{
    private readonly string _connectionString;
    private ConnectionState _state = ConnectionState.Closed;

    public CustomDbConnection() : this(string.Empty) { }
    public CustomDbConnection(string cs) => _connectionString = cs;

    public override string ConnectionString
    {
        get => _connectionString;
        set => throw new NotSupportedException();   // 通常建议不可变
    }
    public override string Database          => "CustomDB";
    public override string DataSource        => "CustomDB";
    public override string ServerVersion     => "1.0";
    public override int    ConnectionTimeout => 30;
    public override ConnectionState State => _state;

    public override void ChangeDatabase(string db)
        => throw new NotSupportedException();

    public override void Open() { /* 握手 / socket / HTTP */ _state = ConnectionState.Open; }
    public override void Close() => _state = ConnectionState.Closed;
    public override Task OpenAsync(CancellationToken ct) { Open(); return Task.CompletedTask; }

    protected override DbTransaction BeginDbTransaction(IsolationLevel il)
        => new CustomDbTransaction(this, il);

    protected override DbCommand CreateDbCommand() => new CustomDbCommand();

    public override DataTable GetSchema() => new();
    public override DataTable GetSchema(string collectionName) => new();
}

internal sealed class CustomDbCommand : DbCommand
{
    public override string CommandText { get; set; } = "";
    public override int CommandTimeout { get; set; } = 30;
    public override CommandType CommandType { get; set; }
    public override bool DesignTimeVisible { get; set; }
    public override UpdateRowSource UpdatedRowSource { get; set; }
    protected override DbConnection DbConnection { get; set; } = null!;
    protected override DbParameterCollection DbParameterCollection { get; } = new CustomDbParamCollection();
    protected override DbTransaction? DbTransaction { get; set; }

    public override void Cancel() { }
    public override void Prepare() { }

    protected override DbParameter CreateDbParameter() => new CustomDbParameter();

    protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior)
        => throw new NotImplementedException("翻译 DbCommand 为底层协议调用");

    public override int ExecuteNonQuery() => throw new NotImplementedException();
    public override object? ExecuteScalar() => throw new NotImplementedException();

    // 异步版本同样要实现
    public override Task<int> ExecuteNonQueryAsync(CancellationToken ct)
        => Task.FromResult(ExecuteNonQuery());
    public override Task<object?> ExecuteScalarAsync(CancellationToken ct)
        => Task.FromResult(ExecuteScalar());
    protected override Task<DbDataReader> ExecuteDbDataReaderAsync(CommandBehavior b, CancellationToken ct)
        => Task.FromResult(ExecuteDbDataReader(b));
}
```

注意 `DbParameterCollection` 也要实现（继承 `DbParameterCollection` 即可）。完整 ADO.NET 接口列表：Open、Close、BeginDbTransaction、CreateDbCommand、ChangeDatabase、GetSchema，以及 Command 的 `ExecuteDbDataReader` / `ExecuteNonQuery` / `ExecuteScalar` + 三个 async 版本。

---

## 9. 注册与使用

```csharp
// 方式 A：直接传 provider
var provider = new CustomDbDataProvider();
using var conn = new DataConnection(provider, "Endpoint=http://localhost:9000");

// 方式 B：全局注册后按名查找
DataConnection.AddDataProvider(CustomDbDataProvider.ProviderName, provider);
using var conn2 = new DataConnection(CustomDbDataProvider.ProviderName, "Endpoint=...");

// 使用 LINQ
var rows = conn.GetTable<Person>()
               .Where(p => p.Age >= 18)
               .OrderBy(p => p.Id)
               .ToArray();
```

`AddDataProvider` 重载：
- `AddDataProvider(IDataProvider)` — 用 provider 自己的 Name
- `AddDataProvider(string providerName, IDataProvider)` — 自定义别名

---

## 10. 两种实现策略

### 策略 A：完全自建（最难）

直接继承 `DataProviderBase`，SQL 默认走 `BasicSqlBuilder` 生成标准 SQL。适用：数据库使用近似标准 SQL 的方言。

### 策略 B：复用现有 Provider（推荐）

继承最接近的现成 provider（如 `PostgreSQLDataProvider : DynamicDataProviderBase<PostgreSQLProviderAdapter>`），只覆写"不同"的 10%。框架层面能直接获得完整的 SQL 方言、DDL、批量、合并等支持。代价是必须把 `IDataProvider` 适配到对应 ADO.NET 类型（`NpgsqlConnection` 等）。

> **判断标准**：如果你的数据库和 PostgreSQL/MySQL/SQL Server/Oracle/Firebird/DB2 中某一个有 ≥80% 的 SQL 兼容性，**永远优先选策略 B**。从零写完整 SQL 方言工作量巨大且容易出 bug。

---

## 11. 关键决策清单

| 问题 | 决策点 |
|------|--------|
| 是否支持事务 | `TransactionsSupported` 重写为 `true` + `BeginDbTransaction` 实现 + `DbTransaction.Commit/Rollback` |
| 是否支持批量插入 | 实现 `BulkCopy` + `BulkCopyAsync` |
| 是否支持 Merge (UPSERT) | `SqlProviderFlags.IsInsertOrUpdateSupported = true` + 实现合并语句构造 |
| 是否支持 OUTPUT 子句 | `IsOutputInsertSupported` / `IsOutputUpdateSupported` / `IsOutputDeleteSupported` |
| 参数前缀 | 默认 `@`；Oracle 用 `:`（通过自定义 SqlBuilder 调整） |
| Schema/库名解析 | 重写 `SchemaProviderBase` 的 `GetDataSourceName` / `GetDatabaseName` |
| 标识符包裹符 | 通过 `MappingSchema` 的 `Configuration` 或 `SqlBuilder` 行为调整 |
| Identifier 大小写敏感性 | `BasicSqlBuilder` 自动按 `MappingSchema` 配置处理 |
| `DateTimeOffset` / `TimeSpan` | `MappingSchema.SetValueToSqlConverter` 显式提供字面量格式 |

---

## 12. 调试技巧

### 12.1 看生成的 SQL

```csharp
DataConnection.TurnTraceSwitchOn(System.Diagnostics.TraceLevel.Verbose);
DataConnection.WriteTraceLine = (msg, level) => Console.WriteLine($"[{level}] {msg}");
```

输出包括每条生成的 SQL、参数、耗时。

### 12.2 mock 后端

在 `DbConnection` 上做一层"接收 SQL → 跑测试 assertion → 返回测试数据"。比连真实数据库调试快一个数量级。

### 12.3 对比 oracle

写完新 Provider 后，对同样 LINQ 跑 PostgreSQL/SQLite Provider，对比生成的 SQL 差异，能快速定位 capability 声明错误。

---

## 13. 常见陷阱

1. **MappingSchema Name 不匹配**：症状是"找不到类型映射"或 `InvalidCastException`。检查 `MappingSchema` 构造里的 `configuration` 参数必须等于 `DataProvider.Name`。

2. **`GetSchema("Tables")` 返回空**：若不实现 SchemaProvider，所有 `GetTable<T>` 都需要 `[Table]` attribute，否则 `FROM ""` 报错。

3. **参数前缀冲突**：`BasicSqlBuilder` 默认 `@`。Oracle 用 `:`，PostgreSQL/MySQL/SQLite 也接受 `?`。需要时通过 `BasicSqlBuilder` 子类覆写参数符号。

4. **NULL 排序语义**：`NULLS FIRST` / `NULLS LAST` 不是所有数据库支持，需要在 `SqlOptimizer.ConvertOrderByClause` 里翻译成 `CASE WHEN x IS NULL ...`。

5. **Boolean 映射**：MySQL `TINYINT(1)` 实际是 int，要在 `MappingSchema` 加值转换器做 `1/0 ↔ bool`。

6. **`DateTimeOffset` / `TimeSpan`**：很多非标数据库不直接支持，要么映射成 `string`（在 `MappingSchema.SetValueToSqlConverter` 里序列化），要么强制 UTC。

7. **`GetSchemaProvider()` 返回 null**：会直接抛异常，必须返回 `SchemaProviderBase` 子类（哪怕什么都不做）。

8. **`CreateConnectionInternal` vs `CreateConnection`**：框架调用 `CreateConnection`，它内部会调 `CreateConnectionInternal`。如果只 override `CreateConnection`，框架自带的连接管理（连接池、监控）可能不生效。**优先 override `CreateConnectionInternal`**。

9. **同步 / 异步必须成对**：override 了 `ExecuteDbDataReader` 就必须也 override `ExecuteDbDataReaderAsync`，否则 `await` 调用可能死锁。

10. **`SupportedTableOptions` 设错**：例如把 `TableOptions.IsTemporary | TableOptions.IsGlobalTemporary` 设上但底层不支持，会在 `CREATE TABLE` 时炸。

---

## 14. 进一步扩展点

| 能力 | 实现位置 |
|------|----------|
| Bulk Copy | override `BulkCopy` / `BulkCopyAsync` |
| Merge (UPSERT) | `SqlProviderFlags.IsInsertOrUpdateSupported` + 自定义 SqlBuilder 处理 |
| OUTPUT clause | `IsOutputInsertSupported` / `IsOutputUpdateSupported` / `IsOutputDeleteSupported` |
| 自定义类型 (`struct MyDomainId`) | `MappingSchema.SetDataType` + `SetScalarValueConverter` |
| 数据库工厂（CREATE TABLE 生成） | `DataProvider.GetDatabaseFactory` + `DataDefinitionService` |
| Schema 迁移 | 同上 + `DiffService` |
| 表达式函数（如 `JsonValue`） | `SqlOptimizer.OptimizeFunction` + `BasicSqlBuilder.ConvertFunction` |

---

## 15. 最小可运行参考

文件清单（仅作结构参考，不需保存）：

```
src/CustomDb.Linq/
├── CustomDbDataProvider.cs       # DataProviderBase 子类
├── CustomDbMappingSchema.cs      # MappingSchema 子类
├── CustomDbSqlFlags.cs           # SqlProviderFlags 工厂
├── CustomDbSqlOptimizer.cs       # BasicSqlOptimizer 子类（可选）
├── CustomDbSchemaProvider.cs     # SchemaProviderBase 子类
└── CustomDbConnection.cs         # DbConnection + DbCommand + DbParameter
```

`Sample.csproj` 引用 `linq2db` 5.x，主程序：

```csharp
var provider = new CustomDbDataProvider();
using var conn = new DataConnection(provider, "Endpoint=http://localhost:9000");
var adults = conn.GetTable<Person>()
                 .Where(p => p.Age >= 18)
                 .OrderBy(p => p.Id)
                 .Select(p => new { p.Id, p.Name })
                 .ToArray();
```


