+++
title = "Missing libc++ symbols for Rust RocksDB"
date = 2025-07-11T10:59:34+01:00
images = []
tags = ["worklog", "rust"]
categories = []
+++

I've been poking around with a Matrix server implementation called Conduit, which uses RocksDB as its data store and I was overjoyed to see it comes with a Nix flake to help set up the local development environment.

One small, seemingly harmless detail caught my eye: it uses Nix to provide a pre-built static library for RocksDB, which then gets pulled into the Cargo build. Great! But when I tried building the final server executable, I ran into some linker errors.

```sh
 note: Undefined symbols for architecture arm64:
            "std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>::at(unsigned long) const", referenced from:
                rocksdb::Customizable::GetOptionName(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&) const in librust_librocksdb_sys-0402a0793211ba9f.rlib(customizable.cc.o)
            "std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>::find(char, unsigned long) const", referenced from:
                rocksdb::Configurable::ConfigureFromString(rocksdb::ConfigOptions const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&) in librust_librocksdb_sys-0402a0793211ba9f.rlib(configurable.cc.o)
                rocksdb::ConfigurableHelper::ConfigureCustomizableOption(rocksdb::ConfigOptions const&, rocksdb::Configurable&, rocksdb::OptionTypeInfo const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, void*) in librust_librocksdb_sys-0402a0793211ba9f.rlib(configurable.cc.o)
                rocksdb::Configurable::GetOptionsMap(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>*, std::__1::unordered_map<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>, std::__1::hash<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>, std::__1::equal_to<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>, std::__1::allocator<std::__1::pair<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>>>*) in librust_librocksdb_sys-0402a0793211ba9f.rlib(configurable.cc.o)
                rocksdb::Configurable::ToString(rocksdb::ConfigOptions const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&) const in librust_librocksdb_sys-0402a0793211ba9f.rlib(configurable.cc.o)
                rocksdb::OptionTypeInfo::NextToken(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, char, unsigned long, unsigned long*, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>*) in librust_librocksdb_sys-0402a0793211ba9f.rlib(options_helper.cc.o)
                rocksdb::OptionTypeInfo::Parse(rocksdb::ConfigOptions const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, void*) const in librust_librocksdb_sys-0402a0793211ba9f.rlib(options_helper.cc.o)
                rocksdb::OptionTypeInfo::Find(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&, std::__1::unordered_map<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>, rocksdb::OptionTypeInfo, std::__1::hash<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>, std::__1::equal_to<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>, std::__1::allocator<std::__1::pair<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const, rocksdb::OptionTypeInfo>>> const&, std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>*) in librust_librocksdb_sys-0402a0793211ba9f.rlib(options_helper.cc.o)
```


The undefined symbols are c++ stdlib, which led me to suspect a missing linker flag, and a quick look at the build output confirmed my hunch — there was no `-lc++` in my grep results. 

This is all trivially fixable, but what I still don't understand: everything compiles fine on linux? So somehow stdlib is getting linked in automatically...

I've opened an [issue](https://github.com/rust-rocksdb/rust-rocksdb/issues/1014) and curious if anyone can provide an answer.

